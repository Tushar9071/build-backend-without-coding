from typing import Dict, Any, List
import json
import asyncio
import os
import uuid
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import aiofiles

class StandardLibrary:
    @staticmethod
    def get_uuid():
        return str(uuid.uuid4())
    
    @staticmethod
    def get_timestamp():
        return datetime.datetime.now().isoformat()
    
    @staticmethod
    def text_upper(s):
        return str(s).upper()
        
    @staticmethod
    def text_lower(s):
        return str(s).lower()
        
    @staticmethod
    def list_length(l):
        if hasattr(l, '__len__'): return len(l)
        return 0

class WorkflowExecutor:
    def __init__(self, workflow_data: Dict[str, Any], db_session: AsyncSession = None):
        self.nodes = {node['id']: node for node in workflow_data.get('nodes', [])}
        self.edges = workflow_data.get('edges', [])
        self.adjacency = {}
        for edge in self.edges:
            source = edge['source']
            target = edge['target']
            handle = edge.get('sourceHandle')
            
            if source not in self.adjacency:
                self.adjacency[source] = []
            self.adjacency[source].append({'target': target, 'handle': handle})
            
        self.context = {} 
        self.execution_log = []
        self.db = db_session

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Initialize Variables
        for node_id, node in self.nodes.items():
            if node['type'] == 'variable':
                await self.execute_node(node)
                
        # Find start node
        start_node = None
        
        # Priority 1: Look for function_start node (for reusable functions)
        for node_id, node in self.nodes.items():
            if node['type'] == 'function_start':
                start_node = node
                break
        
        # Priority 2: Look for api node (for routes)
        if not start_node:
            for node_id, node in self.nodes.items():
                if node['type'] == 'api':
                    start_node = node
                    break
        
        # Priority 3: Fallback - find node with no incoming edges
        if not start_node:
            incoming = set()
            for edge in self.edges:
                incoming.add(edge['target'])
            
            for node_id, node in self.nodes.items():
                if node_id not in incoming and node['type'] != 'variable':
                    start_node = node
                    break
                    
        if not start_node:
            return {"error": "No Entry Point found (Add API Node or Function Start Node)"}

        self.execution_log.append(f"Started execution at {start_node['data'].get('label', 'API Entry')}")
        
        # Context Init
        self.context['request'] = input_data
        if isinstance(input_data.get('body'), dict):
            self.context['body'] = input_data['body']
        if input_data.get('query'):
            self.context['query'] = input_data['query']
        if input_data.get('params'):
            self.context['params'] = input_data['params']
        if input_data.get('user'):
            self.context['user'] = input_data['user']
        
        # Traverse
        current_nodes = [start_node['id']]
        entry_count = 0 
        
        while current_nodes and entry_count < 1000:
            entry_count += 1
            next_layer = []
            
            for node_id in current_nodes:
                node = self.nodes[node_id]
                node_type = node['type']
                self.execution_log.append(f"Executing Node: {node_type} ({node_id})")

                try:
                    res = await self.execute_node(node)
                    
                    if res and res.get('type') == 'response':
                        return {
                            "status": "success",
                            "response": res.get('data'),
                            "logs": self.execution_log,
                            "context": self.context
                        }
                    
                    node_result = None
                    if res and res.get('type') in ['logic', 'loop']:
                        node_result = res.get('result')

                except Exception as e:
                    self.execution_log.append(f"Error executing node {node_id}: {str(e)}")
                    return {
                        "status": "error",
                        "error": str(e),
                        "logs": self.execution_log
                    }

                if node_id in self.adjacency:
                    edges = self.adjacency[node_id]
                    for edge in edges:
                        target_id = edge['target']
                        handle = edge['handle']
                        
                        if node_type == 'logic':
                            if node_result is True and handle == 'true': next_layer.append(target_id)
                            elif node_result is False and handle == 'false': next_layer.append(target_id)
                        elif node_type == 'loop':
                            if node_result == 'do' and handle == 'do': next_layer.append(target_id)
                            elif node_result == 'done' and handle == 'done': next_layer.append(target_id)
                        else:
                            next_layer.append(target_id)
            
            current_nodes = list(set(next_layer))
        
        return {
            "status": "success",
            "message": "Workflow completed",
            "logs": self.execution_log,
            "context": self.context
        }

    def _resolve_val(self, val):
        if not isinstance(val, str): return val
        if val.startswith('{') and val.endswith('}') and val.count('{') == 1:
            return self.context.get(val[1:-1], val)
        if '{' in val and '}' in val:
            for k, v in self.context.items():
                if f"{{{k}}}" in val: val = val.replace(f"{{{k}}}", str(v))
        return val

    async def execute_node(self, node: Dict[str, Any]):
        node_type = node['type']
        data = node.get('data', {})

        if node_type == 'api':
            pass
        
        elif node_type == 'function_start':
            # Function Start Node: Initialize function parameters into context
            # The parameters are defined in node data.parameters, values come from caller
            parameters = data.get('parameters', [])
            func_name = data.get('functionName', 'anonymous')
            
            self.execution_log.append(f"Function Start: {func_name}")
            
            # If this function was called with arguments (via subworkflow),
            # they would be in context['_func_args']
            func_args = self.context.get('_func_args', {})
            
            for param in parameters:
                param_name = param.get('name')
                if param_name:
                    # Get value from passed arguments or default to None
                    self.context[param_name] = func_args.get(param_name)
                    self.execution_log.append(f"  Param '{param_name}' = {self.context.get(param_name)}")
        
        elif node_type == 'function_return':
            # Function Return Node: Return value to caller
            return_type = data.get('returnType', 'variable')
            return_value = data.get('returnValue', '')
            
            result = None
            if return_type == 'variable':
                # First try to get as variable from context
                result = self.context.get(return_value)
                # If not found, check if it's a literal value (number, string, etc)
                if result is None:
                    # Try to parse as number
                    try:
                        if '.' in str(return_value):
                            result = float(return_value)
                        else:
                            result = int(return_value)
                    except (ValueError, TypeError):
                        # Use the raw value as string
                        result = return_value if return_value else None
            elif return_type == 'json':
                # Resolve placeholders in JSON
                final_body = return_value
                for key, val in self.context.items():
                    # Handle {$varName} format
                    placeholder_dollar = f"{{${key}}}"
                    if placeholder_dollar in final_body:
                        if isinstance(val, (dict, list)):
                            final_body = final_body.replace(placeholder_dollar, json.dumps(val))
                        else:
                            final_body = final_body.replace(placeholder_dollar, str(val))
                    # Handle {varName} format
                    placeholder = f"{{{key}}}"
                    if placeholder in final_body:
                        if isinstance(val, (dict, list)):
                            final_body = final_body.replace(placeholder, json.dumps(val))
                        else:
                            final_body = final_body.replace(placeholder, str(val))
                try:
                    result = json.loads(final_body)
                except:
                    result = final_body
            elif return_type == 'expression':
                # Simple expression evaluation
                result = self._resolve_val(return_value)
            
            self.execution_log.append(f"Function Return: {result}")
            return {"type": "response", "data": result}
        
        elif node_type == 'variable':
            var_name = data.get('name')
            var_value = data.get('value')
            var_type = data.get('type', 'string')

            if var_name:
                if isinstance(var_value, str):
                    if var_value.startswith('{') and var_value.endswith('}') and var_value.count('{') == 1:
                        key = var_value[1:-1]
                        if key in self.context: var_value = self.context[key]
                    else:
                        for key, val in self.context.items():
                            placeholder = f"{{{key}}}"
                            if placeholder in var_value: var_value = var_value.replace(placeholder, str(val))
                
                if var_type in ['json', 'array'] and isinstance(var_value, str):
                    try: var_value = json.loads(var_value)
                    except: pass
                elif var_type == 'number':
                    try:
                        var_value = float(var_value)
                        if var_value.is_integer(): var_value = int(var_value)
                    except: pass

                self.context[var_name] = var_value
                self.execution_log.append(f"Set Variable '{var_name}' = {str(var_value)[:50]}...")

        elif node_type == 'function':
            func_name = data.get('name', '').strip()
            # Standard Library Dispatch
            res = None
            try:
                if func_name == 'uuid': res = StandardLibrary.get_uuid()
                elif func_name == 'now' or func_name == 'timestamp': res = StandardLibrary.get_timestamp()
                elif func_name == 'upper': res = StandardLibrary.text_upper(self.context.get('input', '')) # Naive input expectation
                # For more complex functions, we might need Input Variables in the Function Node.
                # For now, let's allow 'resultVar' to store the output.
            except Exception as e:
                self.execution_log.append(f"Function Error {func_name}: {e}")
            
            # If function node has a property to store result
            # We don't have 'resultVar' in FunctionNode schema explicitly yet, but let's assume standard
            # Actually, standard FunctionNode usually just runs. 
            # Let's check context for args? 
            # Simplified: result is stored in 'last_result' or specific var if we add it.
            # Let's auto-store in 'func_result' for now.
            if res is not None:
                self.context['func_result'] = res
                self.execution_log.append(f"Function {func_name} -> {res}")



        elif node_type == 'subworkflow':
            func_id = data.get('functionId')
            if not func_id or not self.db:
                self.execution_log.append("Subworkflow Error: Missing ID or DB")
                return

            # Fetch sub-workflow
            from sqlalchemy.future import select
            from app.models.workflow import Workflow
            
            result = await self.db.execute(select(Workflow).filter(Workflow.id == func_id))
            sub_wf = result.scalars().first()
            
            if not sub_wf:
                self.execution_log.append(f"Subworkflow Not Found: {func_id}")
                return

            self.execution_log.append(f"Calling Function: {sub_wf.name}")
            
            # Get parameter mappings from node data
            param_mappings = data.get('paramMappings', {})
            
            # Resolve each parameter value
            func_args = {}
            for param_name, param_value in param_mappings.items():
                resolved = self._resolve_val(param_value)
                func_args[param_name] = resolved
                self.execution_log.append(f"  Passing {param_name} = {resolved}")
            
            # Prepare data
            sub_data = {
                "nodes": sub_wf.nodes,
                "edges": sub_wf.edges
            }
            
            # Create sub-executor
            sub_executor = WorkflowExecutor(sub_data, db_session=self.db)
            
            # Pre-seed context with parent context and function arguments
            sub_executor.context = self.context.copy()
            sub_executor.context['_func_args'] = func_args  # Special key for FunctionStartNode
            
            sub_res = await sub_executor.run({})
            
            if sub_res.get('status') == 'success':
                self.context['func_result'] = sub_res.get('response')
                self.execution_log.append(f"Function {sub_wf.name} Completed -> func_result = {sub_res.get('response')}")
            else:
                self.execution_log.append(f"Function {sub_wf.name} Failed: {sub_res.get('error')}")


        elif node_type == 'database':
            query = data.get('query', '')
            query_type = data.get('queryType', 'read')
            result_var = data.get('resultVar', 'dbData')
            
            if not self.db: return
            
            final_query = query
            for key, val in self.context.items():
                if f"{{{key}}}" in final_query:
                    val_str = str(val)
                    if isinstance(val, str): val_str = f"'{val_str}'"
                    final_query = final_query.replace(f"{{{key}}}", str(val_str))
            
            try:
                result = await self.db.execute(text(final_query))
                if query_type == 'read':
                    if result.returns_rows:
                        rows = result.mappings().all()
                        res_data = [dict(row) for row in rows]
                        self.context[result_var] = res_data
                        self.execution_log.append(f"DB Read: {len(res_data)} rows")
                    else:
                        self.context[result_var] = []
                else:
                    await self.db.commit()
                    self.context[result_var] = {"affected": result.rowcount}
                    self.execution_log.append(f"DB Write: {result.rowcount} rows affected")
            except Exception as e:
                self.execution_log.append(f"DB Error: {str(e)}")
                # self.context[result_var] = {"error": str(e)} # Optional

        elif node_type == 'code':
            user_code = data.get('code', '')
            try:
                local_scope = self.context.copy()
                local_scope['db'] = self.db
                local_scope['context'] = self.context
                
                if 'await ' in user_code:
                     indented_code = "\n".join(["    " + line for line in user_code.split("\n")])
                     wrapped_code = f"async def _user_async_func(context, db):\n{indented_code}"
                     exec(wrapped_code, {}, local_scope)
                     await local_scope['_user_async_func'](self.context, self.db)
                else:
                    exec(user_code, {}, local_scope)
                self.execution_log.append(f"Executed Python Code")
            except Exception as e:
                self.execution_log.append(f"Code Error: {str(e)}")

        elif node_type == 'file':
            operation = data.get('operation', 'read')
            path = self._resolve_val(data.get('path', ''))
            content = data.get('content', '')
            result_var = data.get('resultVar', 'fileData')
            
            try:
                if operation == 'read':
                    if os.path.exists(path):
                        async with aiofiles.open(path, mode='r') as f:
                            data = await f.read()
                        self.context[result_var] = data
                    else:
                        self.context[result_var] = None
                        self.execution_log.append(f"File Read Error: Not found {path}")
                elif operation == 'write':
                    final_content = self._resolve_val(content)
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    async with aiofiles.open(path, mode='w') as f:
                        await f.write(str(final_content))
                    self.context[result_var] = True
                elif operation == 'delete':
                    if os.path.exists(path):
                        os.remove(path)
                        self.context[result_var] = True
                    else: self.context[result_var] = False
                elif operation == 'list':
                     if os.path.isdir(path):
                         files = os.listdir(path)
                         self.context[result_var] = files
                     else: self.context[result_var] = []
            except Exception as e:
                self.execution_log.append(f"File Error: {str(e)}")

        elif node_type == 'logic':
            raw_condition = data.get('condition', 'False')
            condition = raw_condition.replace('===', '==').replace('!==', '!=')
            try:
                result = eval(condition, {"__builtins__": {}}, self.context)
                self.execution_log.append(f"Logic: '{raw_condition}' -> {bool(result)}")
                return {"type": "logic", "result": bool(result)}
            except Exception as e:
                self.execution_log.append(f"Logic Error: {e}")
                return {"type": "logic", "result": False}

        elif node_type == 'math':
            val_a = self._resolve_val(data.get('valA'))
            val_b = self._resolve_val(data.get('valB'))
            op = data.get('op', '+')
            result_var = data.get('resultVar', 'result')
            try:
                num_a = float(val_a)
                num_b = float(val_b)
                res = 0
                if op == '+': res = num_a + num_b
                elif op == '-': res = num_a - num_b
                elif op == '*': res = num_a * num_b
                elif op == '/': res = num_a / num_b if num_b != 0 else 0
                elif op == '%': res = num_a % num_b
                
                if num_a.is_integer() and num_b.is_integer():
                     if int(res) == res: res = int(res)
                self.context[result_var] = res
            except:
                if op == '+':
                    self.context[result_var] = str(val_a) + str(val_b)

        elif node_type == 'data_op':
            collection = self._resolve_val(data.get('collection', ''))
            op = data.get('op', 'sum')
            result_var = data.get('resultVar', 'summary')
            
            if isinstance(collection, str):
                if collection in self.context: collection = self.context[collection]
                elif collection == 'body': collection = self.context.get('body', [])
            if not isinstance(collection, list): collection = []

            nums = []
            for x in collection:
                try: nums.append(float(x))
                except: pass
            
            res = 0
            if op == 'count': res = len(collection)
            elif op == 'sum': res = sum(nums)
            elif op == 'avg': res = sum(nums) / len(nums) if nums else 0
            
            self.context[result_var] = res

        elif node_type == 'interface':
            fields = data.get('fields', [])
            mode = data.get('transferMode', 'body')
            target_data = self.context.get(mode, {})
            
            missing = []
            for field in fields:
                if field.get('required') and field.get('name') not in target_data:
                    missing.append(field.get('name'))
            
            if missing:
                 self.execution_log.append(f"Validation Failed: Missing {missing}")
                 return {
                    "type": "response", 
                    "data": {"error": "Validation Failed", "missing": missing, "detail": f"Missing required fields: {', '.join(missing)}"}
                }

        elif node_type == 'loop':
            collection = self._resolve_val(data.get('collection', ''))
            item_var = data.get('variable', 'item')
            
            if isinstance(collection, str):
                collection = self.context.get(collection, [])
            
            if not isinstance(collection, list): collection = []

            loop_states = self.context.setdefault('_loop_states', {})
            state = loop_states.get(node.get('id'), {'index': 0})
            idx = state['index']
            
            if idx < len(collection):
                item = collection[idx]
                if item_var: self.context[item_var] = item
                state['index'] = idx + 1
                loop_states[node.get('id')] = state
                return {"type": "loop", "result": "do"}
            else:
                state['index'] = 0 
                loop_states[node.get('id')] = state
                return {"type": "loop", "result": "done"}

        elif node_type == 'response':
            resp_type = data.get('responseType', 'json')
            body_def = data.get('body', '{}')
            
            if resp_type == 'variable':
                var_name = body_def
                # Handle $varName format
                if isinstance(var_name, str) and var_name.startswith('$'):
                    var_name = var_name[1:]
                # Handle {varName} format  
                if isinstance(var_name, str) and var_name.startswith('{') and var_name.endswith('}'):
                    var_name = var_name[1:-1]
                # Handle {$varName} format
                if isinstance(var_name, str) and var_name.startswith('$'):
                    var_name = var_name[1:]
                val = self.context.get(var_name)
                return {"type": "response", "data": val}
            else:
                final_body = body_def
                # Replace all variable patterns in the body
                for key, val in self.context.items():
                    # Handle {$varName} format (common from autocomplete)
                    placeholder_dollar_brace = f"{{${key}}}"
                    if placeholder_dollar_brace in final_body:
                        if isinstance(val, (dict, list)): 
                            final_body = final_body.replace(placeholder_dollar_brace, json.dumps(val))
                        else: 
                            final_body = final_body.replace(placeholder_dollar_brace, str(val))
                    
                    # Handle {varName} format
                    placeholder_brace = f"{{{key}}}"
                    if placeholder_brace in final_body:
                        if isinstance(val, (dict, list)): 
                            final_body = final_body.replace(placeholder_brace, json.dumps(val))
                        else: 
                            final_body = final_body.replace(placeholder_brace, str(val))
                    
                    # Handle $varName format
                    placeholder_dollar = f"${key}"
                    # Only replace if not inside braces (avoid double replacement)
                    if placeholder_dollar in final_body and f"{{{placeholder_dollar}}}" not in body_def:
                        if isinstance(val, (dict, list)): 
                            final_body = final_body.replace(placeholder_dollar, json.dumps(val))
                        else: 
                            final_body = final_body.replace(placeholder_dollar, str(val))
                
                self.execution_log.append(f"Response body after substitution: {final_body}")
                try: 
                    parsed = json.loads(final_body)
                    return {"type": "response", "data": parsed}
                except Exception as e: 
                    self.execution_log.append(f"JSON parse error: {e}")
                    return {"type": "response", "data": final_body}
        
        return None
