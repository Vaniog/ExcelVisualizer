class ExpParser {
    constructor() {
        this.operations = ["+", "-", "*", "/", "sqrt", "pow"];
        this.priors = [0, 0, 1, 1, 2, 2];
        this.arity = [2, 2, 2, 2, 1, 2];
    }

    IsOperation(symbol) {
        return this.operations.includes(symbol);
    }
    GetPrior(symbol) {
        return this.priors[this.operations.indexOf(symbol)];
    }
    GetArity(symbol) {
        return this.arity[this.operations.indexOf(symbol)];
    }

    ToExp(exp_str) {
        let exp = [];

        let var_name = "";
        let bracket_depth = 0;
        let prior_for_bracket = 10;
        let op_stack = [];
        function VarNamePush() {
            if (var_name != "") {
                exp.push({ var_name: var_name, type: "var" });
            }
            var_name = "";
        }

        for (let exp_char of exp_str) {
            if (exp_char == " ") {
                continue;
            }

            if (exp_char == "(") {
                if (var_name != "") {
                    if (this.GetArity(var_name) == 1) {
                        exp.push({
                            operation: var_name,
                            priority: bracket_depth + this.GetPrior(var_name),
                            type: "operation",
                        });
                    }
                    op_stack.push({
                        var_name: var_name,
                        depth: bracket_depth,
                    });
                    var_name = "";
                }
                bracket_depth += prior_for_bracket;
                continue;
            }

            if (exp_char == ")") {
                bracket_depth -= prior_for_bracket;
                VarNamePush();
                continue;
            }

            if (exp_char == ";") {
                if (bracket_depth == op_stack[op_stack.length - 1].depth) {
                    let priority = this.GetPrior(
                        op_stack[op_stack.length - 1].var_name
                    );
                    exp.push({
                        operation: op_stack.pop().var_name,
                        priority: bracket_depth + priority,
                        type: "operation",
                    });
                }
                VarNamePush();
                continue;
            }

            if (!this.IsOperation(exp_char)) {
                var_name += exp_char;
                continue;
            }

            // exp_char is operation
            VarNamePush();

            exp.push({
                operation: exp_char,
                priority: bracket_depth + this.GetPrior(exp_char),
                type: "operation",
            });
        }
        VarNamePush();
        console.log(exp);
        this.WriteTree(this.TreeFromExp(exp));
    }

    WriteTree(root, depth = 0) {
        if (root == undefined) return;
        this.WriteTree(root.left, depth + 1);
        process.stdout.write("    ".repeat(depth));
        if (root.var_name == undefined) console.log(root.operation);
        else console.log(root.var_name);
        this.WriteTree(root.right, depth + 1);
    }

    TreeFromExp(exp) {
        while (exp.length != 1) {
            var to_do = { priority: -1, index: -1 };
            for (let i = exp.length - 1; i >= 0; i--) {
                if (exp[i].type == "var" || exp[i].priority < to_do.priority)
                    continue;

                (to_do.index = i), (to_do.priority = exp[i].priority);
            }

            let index = to_do.index;
            let rh = undefined;
            let rh_ind = -1;
            let lh = undefined;
            let lh_ind = -1;

            if (this.GetArity(exp[index].operation) != 1) {
                for (let i = index; i >= 0; i--) {
                    if (exp[i].type == "var") {
                        lh = exp[i];
                        lh_ind = i;
                        break;
                    }
                }
            }

            for (let i = index; i < exp.length; i++) {
                if (exp[i].type == "var") {
                    rh = exp[i];
                    rh_ind = i;
                    break;
                }
            }

            var new_el = {
                operation: exp[index].operation,
                type: "var",
                left: lh,
                right: rh,
            };

            exp.splice(rh_ind, 1, new_el);
            if (lh_ind != -1) {
                exp.splice(lh_ind, 1);
                index--;
            }
            exp.splice(index, 1);
        }
        return exp[0];
    }
}

new ExpParser().ToExp("pow(3 * (3 + 1); 2)");
