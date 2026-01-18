from typing import Dict, Any, List
import json

class WorkflowExecutor:
    def __init__(self, workflow_data: Dict[str, Any]):
        self.nodes = {node['id']: node for node in workflow_data.get('nodes', [])}
        self.edges = workflow_data.get('edges', [])
        # Map output node ID -> List of edge dicts {target, handle}
        self.adjacency = {}
        for edge in self.edges:
            source = edge['source']
            target = edge['target']
            handle = edge.get('sourceHandle') # 'true' or 'false' for logic nodes. Null for others.
            
            if source not in self.adjacency:
                self.adjacency[source] = []
            self.adjacency[source].append({'target': target, 'handle': handle})
            
        self.context = {} # Variable storage
        self.execution_log = []

    async def run(self, input_data: Dict[str, Any], db_session = None, user_id: str = None) -> Dict[str, Any]:
        """
        Execute the workflow starting from the 'api' node.
        """
        self.db_session = db_session
        self.user_id = user_id

        # 1. Initialize all Variables first (Global Scope)
        for node_id, node in self.nodes.items():
            if node['type'] == 'variable':
                await self.execute_node(node)
                
        # Find start node (API Node)
        start_node = None
        start_node_id = input_data.get('start_node_id')
        
        if start_node_id and start_node_id in self.nodes:
             start_node = self.nodes[start_node_id]
        else:
            for node_id, node in self.nodes.items():
                if node['type'] == 'api':
                    start_node = node
                    break
        
        if not start_node:
            print("No API Entry found")
            return {"error": "No API Entry Point found"}

        self.execution_log.append(f"Started execution at {start_node['data'].get('label', 'API Entry')}")
        
        # Initialize context with request data flattened for easier access
        # input_data structure from invoke.py: { "method": ..., "body": {}, "query": {}, "params": {} }
        self.context['request'] = input_data
        
        # Expose top-level convenience variables for non-tech users
        # Users can just use {body}, {query.id}, {params.userId} etc.
        if isinstance(input_data.get('body'), dict):
            self.context['body'] = input_data['body']
        if input_data.get('query'):
            self.context['query'] = input_data['query']
        if input_data.get('params'):
            self.context['params'] = input_data['params']
        
        # Traverse
        current_nodes = [start_node['id']]
        
        visited = set()
        response = None

        # Max iterations to prevent infinite loops (naive check)
        entry_count = 0 
        
        while current_nodes and entry_count < 1000:
            entry_count += 1
            next_layer = []
            
            # Process current layer
            for node_id in current_nodes:
                # Allow re-visiting for loops, but for DAGs we might want visited check.
                # For this simple implementation, we allow re-visit if it's a different path, 
                # but 'visited' set prevents infinite cycles for now if we strictly track ID.
                # Removing strict visited check to allow merging paths, but we need loop detection.
                # For now: simple visited check per run? No, visited check kills merge paths.
                # Let's just run. Set-based 'visited' is bad for merge nodes (multiple inputs).
                # We simply consume the current wave.
                
                node = self.nodes[node_id]
                node_type = node['type']
                self.execution_log.append(f"Executing Node: {node_type} ({node_id})")

                try:
                    res = await self.execute_node(node)
                    
                    # Check for immediate response
                    if res and res.get('type') == 'response':
                        response = res.get('data')
                        return {
                            "status": "success",
                            "response": response,
                            "logs": self.execution_log,
                            "context": self.context
                        }
                    
                    # Handle Logic/Loop Outcome
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

                # Add downstream nodes with routing logic
                if node_id in self.adjacency:
                    edges = self.adjacency[node_id]
                    for edge in edges:
                        target_id = edge['target']
                        handle = edge['handle']
                        
                        if node_type == 'logic':
                            # Route based on True/False
                            if node_result is True and handle == 'true':
                                next_layer.append(target_id)
                            elif node_result is False and handle == 'false':
                                next_layer.append(target_id)
                        elif node_type == 'loop':
                            # Route based on do/done
                            if node_result == 'do' and handle == 'do':
                                next_layer.append(target_id)
                            elif node_result == 'done' and handle == 'done':
                                next_layer.append(target_id)
                        else:
                            # Normal flow, take all connected edges
                            next_layer.append(target_id)
            
            # De-duplicate next layer to avoid processing same node twice in same step
            current_nodes = list(set(next_layer))
        
        return {
            "status": "success",
            "message": "Workflow completed without specific response",
            "logs": self.execution_log,
            "context": self.context
        }

    def _resolve_val(self, val):
        """Helper to substitute variables in a string (supporting $var or {var}) or return the specific object from context if exact match."""
        if not isinstance(val, str):
            return val
        
        # 1. Exact Match Check (Preserves Type)
        # Check {key}
        if val.startswith('{') and val.endswith('}') and val.count('{') == 1:
            key = val[1:-1]
            return self.context.get(key, val)
        # Check $key
        if val.startswith('$') and ' ' not in val and len(val) > 1:
            key = val[1:]
            # Ensure it's not part of a string like "$100" unless it's a known var?
            # User wants $variable syntax. If $variable is in context, return it.
            if key in self.context:
                return self.context[key]
        
        # 2. String Interpolation
        # Replace {key}
        if '{' in val and '}' in val:
            for k, v in self.context.items():
                if f"{{{k}}}" in val:
                    val = val.replace(f"{{{k}}}", str(v))
        
        # Replace $key
        # We need to be careful not to replace $money if it's not a var.
        # Simple approach: iterate keys and replace $key with value.
        # Better approach: Regex, but simplistic loop works for now if keys are distinct.
        if '$' in val:
             for k, v in self.context.items():
                 # We sort keys by length desc to avoid partial replacement collision? 
                 # (e.g. $var vs $variable) - Python dict iteration order is insertion based (usually).
                 placeholder = f"${k}"
                 if placeholder in val:
                     val = val.replace(placeholder, str(v))
            
        return val

    def _validate_schema(self, fields: List[Dict[str, Any]], target_data: Any) -> tuple[List[str], List[str]]:
        def recursive_validate(schema_fields, current_data, path="root"):
            missing_errs = []
            invalid_errs = []
            
            # Check 1: Must be object if it has fields to validate
            if not isinstance(current_data, dict):
                # If we are validating query/params, they might be empty regular dicts, which is fine.
                # If body, it might be None or list.
                if current_data is None:
                    current_data = {} 
                else:
                    invalid_errs.append(f"{path} (expected object, got {type(current_data).__name__})")
                    return missing_errs, invalid_errs

            for field in schema_fields:
                name = field.get('name')
                if not name: continue
                
                required = field.get('required', False)
                f_type = field.get('type', 'string')
                children = field.get('children', [])
                
                current_path = f"{path}.{name}" if path != "root" else name
                
                # Missing Check
                if name not in current_data:
                    if required:
                        missing_errs.append(current_path)
                    continue
                
                val = current_data[name]
                
                # Type Check
                if f_type == 'string' and not isinstance(val, str):
                    invalid_errs.append(f"{current_path} (expected string)")
                elif f_type == 'number' and not isinstance(val, (int, float)):
                    invalid_errs.append(f"{current_path} (expected number)")
                elif f_type == 'boolean' and not isinstance(val, bool):
                    invalid_errs.append(f"{current_path} (expected boolean)")
                elif f_type == 'array' and not isinstance(val, list):
                    invalid_errs.append(f"{current_path} (expected array)")
                elif f_type == 'object':
                    if not isinstance(val, dict):
                            invalid_errs.append(f"{current_path} (expected object)")
                    else:
                            # Recursive Validation for Nested Objects
                            if children:
                                c_missing, c_invalid = recursive_validate(children, val, current_path)
                                missing_errs.extend(c_missing)
                                invalid_errs.extend(c_invalid)

            return missing_errs, invalid_errs

        return recursive_validate(fields, target_data)

    async def execute_node(self, node: Dict[str, Any]):
        node_type = node['type']
        data = node.get('data', {})

        if node_type == 'api':
            # Check for inline Body Validation
            validation_fields = data.get('validationFields', [])
            if validation_fields:
                method = data.get('method', 'GET')
                # Only validate body for unsafe methods usually, but let's just stick to what's defined.
                # If fields exist, we validate body.
                body_data = self.context.get('body', {})
                
                missing, invalid_types = self._validate_schema(validation_fields, body_data)
                
                if missing or invalid_types:
                    error_msg = "Validation Error: "
                    if missing:
                        error_msg += f"Missing fields: {', '.join(missing)}. "
                    if invalid_types:
                        error_msg += f"Invalid types: {', '.join(invalid_types)}."
                    
                    self.execution_log.append(f"API Body Validation Failed: {error_msg}")
                    return {
                        "type": "response", 
                        "data": {
                            "error": "Bad Request", 
                            "message": error_msg.strip(),
                            "details": {
                                "missing": missing,
                                "invalid": invalid_types
                            }
                        }
                    }
                self.execution_log.append("API Body Validation Passed")
        
        elif node_type == 'variable':
            # Variable Node Execution (Init or Update)
            var_name = data.get('name')
            var_value = data.get('value')
            var_type = data.get('type', 'string')

            if var_name:
                # 1. Perform Variable Substitution if value is a string
                # This allows "Set Variable" to take values from previous nodes e.g. "{body.id}"
                if isinstance(var_value, str):
                    # Check for single variable replacement like "{myObj}" or "$myObj" to preserve type
                    if var_value.startswith('{') and var_value.endswith('}') and var_value.count('{') == 1:
                        key = var_value[1:-1]
                        if key in self.context:
                            var_value = self.context[key]
                    elif var_value.startswith('$') and ' ' not in var_value and len(var_value) > 1:
                        key = var_value[1:]
                        if key in self.context:
                            var_value = self.context[key]
                    else:
                        # Mixed string interpolation
                        for key, val in self.context.items():
                            # Replace {key}
                            placeholder = f"{{{key}}}"
                            if placeholder in var_value:
                                var_value = var_value.replace(placeholder, str(val))
                            # Replace $key
                            placeholder_d = f"${key}"
                            if placeholder_d in var_value:
                                var_value = var_value.replace(placeholder_d, str(val))
                
                # 2. Type parsing for JSON/Array
                if var_type in ['json', 'array'] and isinstance(var_value, str):
                    try:
                        var_value = json.loads(var_value)
                    except:
                        # If parse fails, keep as string but maybe log warning?
                        # For now, simplistic approach.
                        pass

                self.context[var_name] = var_value
                self.execution_log.append(f"Set Variable '{var_name}' = {str(var_value)[:50]}...")

        elif node_type == 'logic':
            # Evaluate condition
            # Syntax: User might use JS "===" or "!==" or simple "x > 10"
            raw_condition = data.get('condition', 'False')
            
            # Simple sanitization/conversion for Python eval
            # Replace === with ==
            condition = raw_condition.replace('===', '==').replace('!==', '!=')
            
            # Remove $ prefix from variables for python eval context
            # e.g. $valA > 10 -> valA > 10
            # We use regex to find $ followed by word characters
            import re
            # Replace $word with word
            condition = re.sub(r'\$([a-zA-Z_]\w*)', r'\1', condition)
            
            try:
                # We pass 'self.context' as locals so variables are directly accessible by name
                # e.g. "myVar > 10" works if myVar is in context
                result = eval(condition, {"__builtins__": {}}, self.context)
                self.execution_log.append(f"Logic: '{raw_condition}' -> {bool(result)}")
                return {"type": "logic", "result": bool(result)}
            except Exception as e:
                self.execution_log.append(f"Logic Error: {e}")
                return {"type": "logic", "result": False}

        elif node_type == 'math':
            # Arithmetic Logic
            val_a = self._resolve_val(data.get('valA'))
            val_b = self._resolve_val(data.get('valB'))
            op = data.get('op', '+')
            result_var = data.get('resultVar', 'result')
            
            # Try to convert to numbers
            try:
                num_a = float(val_a)
                num_b = float(val_b)
                
                res = 0
                if op == '+': res = num_a + num_b
                elif op == '-': res = num_a - num_b
                elif op == '*': res = num_a * num_b
                elif op == '/': res = num_a / num_b if num_b != 0 else 0
                elif op == '%': res = num_a % num_b
                
                # If both were integers (e.g. 10.0), cast back to int for cleanliness?
                if num_a.is_integer() and num_b.is_integer():
                     res = int(res) if res != int(res) else res # wait, simple check:
                     if int(res) == res: res = int(res)

                self.context[result_var] = res
                self.execution_log.append(f"Math: {num_a} {op} {num_b} = {res}")
            except Exception:
                # Fallback to string operations for + or failure
                if op == '+':
                    res = str(val_a) + str(val_b)
                    self.context[result_var] = res
                    self.execution_log.append(f"Math (Str): {val_a} + {val_b} = {res}")
                else:
                    self.execution_log.append(f"Math Error: Could not process {val_a} {op} {val_b}")

        elif node_type == 'data_op':
            # Data Aggregation Logic
            collection_source = data.get('collection', '')
            op = data.get('op', 'sum')
            result_var = data.get('resultVar', 'summary')
            
            # 1. Resolve Collection (Same robustness as Loop)
            collection = self._resolve_val(collection_source)
            if isinstance(collection, str):
                if collection in self.context:
                    collection = self.context[collection]
                elif collection == 'body':
                     collection = self.context.get('body', [])
            
            if not isinstance(collection, list):
                 self.execution_log.append(f"DataNode Error: Input is not a list. Value: {str(collection)[:20]}")
                 collection = []

            # 2. Extract Numbers
            # Helper to get numeric values
            nums = []
            for x in collection:
                try:
                    nums.append(float(x))
                except:
                    pass
            
            res = 0
            if op == 'count':
                res = len(collection) # Count includes non-numbers
            elif op == 'sum':
                res = sum(nums)
            elif op == 'avg':
                res = sum(nums) / len(nums) if nums else 0
            elif op == 'min':
                res = min(nums) if nums else 0
            elif op == 'max':
                res = max(nums) if nums else 0
            
            # Clean int casting
            if isinstance(res, float) and res.is_integer():
                res = int(res)

            self.context[result_var] = res
            self.execution_log.append(f"Data Op: {op}(len={len(collection)}) = {res}")

        elif node_type == 'interface':
            # Schema Validation for Request Body
            fields = data.get('fields', [])
            mode = data.get('transferMode', 'body')
            
            target_data = {}
            if mode == 'query':
                target_data = self.context.get('query', {})
            elif mode == 'params':
                target_data = self.context.get('params', {})
            else:
                target_data = self.context.get('body', {})
            
            missing, invalid_types = self._validate_schema(fields, target_data)

            if missing or invalid_types:
                error_msg = "Validation Error: "
                if missing:
                    error_msg += f"Missing fields: {', '.join(missing)}. "
                if invalid_types:
                    error_msg += f"Invalid types: {', '.join(invalid_types)}."
                
                self.execution_log.append(f"Interface Validation Failed: {error_msg}")
                # Return immediate response which stops workflow
                return {
                    "type": "response", 
                    "data": {
                        "error": "Bad Request", 
                        "message": error_msg.strip(),
                        "details": {
                            "missing": missing,
                            "invalid": invalid_types
                        }
                    }
                }
            
            self.execution_log.append(f"Interface Validation Passed")

        elif node_type == 'loop':
            collection_source = data.get('collection', '')
            item_var = data.get('variable', 'item')
            
            # 1. First Pass: Resolve {variables} or keep string
            collection = self._resolve_val(collection_source)
            
            # 2. Second Pass: If string, try path lookup (body.items or direct key)
            if isinstance(collection, str):
                if collection.startswith('body.'):
                     path_parts = collection.split('.')
                     curr = self.context.get('body', {})
                     for part in path_parts[1:]:
                         if isinstance(curr, dict):
                             curr = curr.get(part)
                         else:
                             curr = []
                             break
                     collection = curr
                elif collection == 'body':
                     collection = self.context.get('body', [])
                elif collection in self.context:
                     collection = self.context[collection]
            
            # 3. Validation
            if not isinstance(collection, list):
                 self.execution_log.append(f"Loop Error: Collection '{collection_source}' resolved to {type(collection)}, expected list. Defaulting to empty.")
                 collection = []

            # Get State
            loop_states = self.context.setdefault('_loop_states', {})
            state = loop_states.get(node.get('id'), {'index': 0})
            
            idx = state['index']
            
            if idx < len(collection):
                # Do
                item = collection[idx]
                if item_var:
                    self.context[item_var] = item
                self.execution_log.append(f"Loop {node.get('id')}: Item {idx} = {str(item)[:20]}")
                
                # Increment
                state['index'] = idx + 1
                loop_states[node.get('id')] = state
                return {"type": "loop", "result": "do"}
            else:
                # Done
                self.execution_log.append(f"Loop {node.get('id')}: Done")
                # Reset for next run
                state['index'] = 0 
                loop_states[node.get('id')] = state
                return {"type": "loop", "result": "done"}

        elif node_type == 'function':
            func_name = data.get('name', 'func')
            self.execution_log.append(f"Ran function {func_name}")
            # Mock
        
        elif node_type == 'response':
            resp_type = data.get('responseType', 'json')
            body_def = data.get('body', '{}')
            
            if resp_type == 'variable':
                var_name = body_def
                val = self.context.get(var_name)
                if not val and isinstance(var_name, str) and var_name.startswith('{') and var_name.endswith('}'):
                     stripped = var_name.strip('{}')
                     val = self.context.get(stripped)
                return {"type": "response", "data": val}
            else:
                try:
                    import re
                    
                    # Helper to resolve deep paths like "body.user.email"
                    def get_value_from_path(path_str, context):
                        parts = path_str.split('.')
                        curr = context
                        for p in parts:
                            if isinstance(curr, dict) and p in curr:
                                curr = curr[p]
                            elif isinstance(curr, list) and p.isdigit():
                                idx = int(p)
                                if 0 <= idx < len(curr):
                                    curr = curr[idx]
                                else:
                                    return None
                            else:
                                return None
                        return curr

                    final_body = body_def
                    
                    # Regex to find $variable or $var.prop.nested
                    # Matches $ followed by word char, then optionally dots and word chars
                    # We sort matches by length descending to replace longest paths first (not strictly needed with regex but safer)
                    # But simpler: use re.sub with callback.
                    
                    # Regex to find $variable, enclosed $variable, or dot notation
                    # Matches:
                    # 1. Optional opening brace \{
                    # 2. The $ symbol
                    # 3. The path (word + dots)
                    # 4. Optional closing brace \}
                    pattern = r'(\{?)\$([a-zA-Z_][a-zA-Z0-9_.]*)(\}?)'
                    
                    def replacer(match):
                        full_match = match.group(0)
                        prefix = match.group(1) # {
                        path = match.group(2)   # var.path
                        suffix = match.group(3) # }
                        
                        # Resolve value
                        val = self.context.get(path)
                        if val is None:
                             val = get_value_from_path(path, self.context)
                        
                        if val is None:
                            # Safely handle missing values
                            if prefix == '{' and suffix == '}':
                                # {$var} -> null (valid JSON value)
                                return "null"
                            # If $var is bare, we return matches to avoid breaking strings like "Price: $10"
                            # But if it looks like a variable placeholder that failed, what to do?
                            # For now, returning full_match preserves behavior for non-variable $ usage.
                            return full_match
                            
                        start = match.start()
                        end = match.end()
                        
                        is_wrapped_in_braces = (prefix == '{' and suffix == '}')
                        
                        # Check context in original string for quotes
                        is_already_quoted = False
                        if start > 0 and end < len(body_def):
                            if body_def[start-1] == '"' and body_def[end] == '"':
                                is_already_quoted = True
                                
                        if is_wrapped_in_braces:
                            return json.dumps(val)
                            
                        if is_already_quoted:
                            s = json.dumps(val)
                            if s.startswith('"') and s.endswith('"'):
                                return s[1:-1]
                            return str(val)
                        else:
                            return json.dumps(val)

                    final_body = re.sub(pattern, replacer, final_body)

                    return {"type": "response", "data": json.loads(final_body)}
                except Exception as e:
                    self.execution_log.append(f"Error parsing response body: {e}")
                    return {"type": "response", "data": {"raw": body_def, "error": "JSON parse error"}}
        
        elif node_type == 'database':
            # Database Operations
            from app.services.external_db import ExternalDbService
            from app.models.workflow import DatabaseConnection
            from sqlalchemy import select

            if not self.db_session:
                 self.execution_log.append("Database Error: No System DB Session")
                 return {"type": "database", "error": "System Error"}
                 
            # Fetch User's DB Connection
            # match workflow owner
            # We need user_id. Let's assume it's set in self.user_id
            if not getattr(self, 'user_id', None):
                 self.execution_log.append("Database Error: No User Context")
                 # Fallback? No, strict auth required now.
                 return {"type": "database", "error": "No User Context"}

            # Query DB Connection for this user
            # We assume 1 connection per user for MVP
            stmt = select(DatabaseConnection).filter(DatabaseConnection.user_id == self.user_id)
            res = await self.db_session.execute(stmt)
            db_conn = res.scalars().first()
            
            if not db_conn:
                 self.execution_log.append("Database Error: No External Database Configured for User")
                 return {"type": "database", "error": "No External DB Config"}

            engine = await ExternalDbService.get_engine(db_conn.connection_string)
            
            if not engine:
                self.execution_log.append("Database Error: Could not connect to External DB")
                return {"type": "database", "error": "Connection Failed"}
                
            query_template = data.get('query', '')
            query_type = data.get('queryType', 'read') # read (select) or write (insert/update/delete)
            result_var = data.get('resultVar', 'dbResult')
            
            from sqlalchemy import text
            
            resolved_query = self._resolve_val(query_template)
            if not isinstance(resolved_query, str):
                resolved_query = str(resolved_query)
            
            self.execution_log.append(f"DB Exec: {resolved_query[:100]}...")
            
            try:
                # Use the external engine
                async with engine.begin() as conn:
                    # Bind parameters? 
                    # Ideally pass params to text(), but we replaced strings already.
                    # We can pass context params as a fallback for :param syntax
                    params = {k: v for k, v in self.context.items() if isinstance(v, (str, int, float, bool, type(None)))}
                    
                    result = await conn.execute(text(resolved_query), params)
                    
                    if query_type == 'read' and result.returns_rows:
                        rows = result.mappings().all()
                        data_res = [dict(row) for row in rows]
                        self.context[result_var] = data_res
                        self.execution_log.append(f"DB Result: Found {len(data_res)} rows")
                    else:
                        # Write ops commit automatically with .begin() context manager
                        self.context[result_var] = {"status": "success", "rows_affected": result.rowcount}
                        self.execution_log.append(f"DB Write Success. Rows affected: {result.rowcount}")

            except Exception as e:
                self.execution_log.append(f"DB Error: {str(e)}")
                return {"type": "database", "error": str(e)}

        return None
