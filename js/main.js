class ExpParser {
    constructor() {
        this.operations = ["+", "-", "*", "/", "sqrt", "^", "sum", "aver"];
        this.priors = [0, 0, 1, 1, 2, 2, 2, 2];
        this.arity = [2, 2, 2, 2, 1, 2, 1, 1];
        this.convertions = {
            pow: "^",
            КОРЕНЬ: "sqrt",
            СТЕПЕНЬ: "^",
            СУММ: "sum",
            СРЗНАЧ: "aver",
        };
        this.pretty_converter = {
            "*": "·",
            sqrt: "√",
            sum: "Σ",
        };
        this.op_names = [
            "plus",
            "subs",
            "mult",
            "divide",
            "sqrt",
            "pow",
            "sum",
            "average",
        ];
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

    TryToConvert(operation) {
        if (this.convertions[operation] != undefined) {
            operation = this.convertions[operation];
        }
        return operation;
    }

    ToExp(exp_str) {
        if (exp_str.charAt(0) == "=") {
            exp_str = exp_str.slice(1);
        }
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
                    var_name = this.TryToConvert(var_name);
                    if (this.GetArity(var_name) == 1) {
                        exp.push({
                            operation: var_name,
                            priority: bracket_depth + this.GetPrior(var_name),
                            type: "operation",
                        });
                    } else {
                        op_stack.push({
                            var_name: var_name,
                            depth: bracket_depth,
                        });
                    }
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
                VarNamePush();
                let priority = this.GetPrior(
                    op_stack[op_stack.length - 1].var_name
                );
                exp.push({
                    operation: op_stack.pop().var_name,
                    priority: bracket_depth - prior_for_bracket + priority,
                    type: "operation",
                });
                continue;
            }

            if (!this.IsOperation(exp_char)) {
                var_name += exp_char;
                continue;
            }

            // exp_char is operation
            exp_char = this.TryToConvert(exp_char);
            VarNamePush();

            exp.push({
                operation: exp_char,
                priority: bracket_depth + this.GetPrior(exp_char),
                type: "operation",
            });
        }
        VarNamePush();
        return exp;
    }

    WriteTree(root, depth = 0) {
        if (root == undefined) return;
        this.WriteTree(root.right, depth + 1);
        if (root.var_name == undefined) console.log(root.operation);
        else console.log(root.var_name);
        this.WriteTree(root.left, depth + 1);
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
                priority: exp[index].priority,
            };

            exp.splice(rh_ind, 1, new_el);
            if (lh_ind != -1) {
                exp.splice(lh_ind, 1);
                index--;
            }
            exp.splice(index, 1);
        }
        this.CountHeight(exp[0]);
        return exp[0];
    }

    CountHeight(root) {
        if (root == undefined) {
            return 0;
        }
        root.height =
            Math.max(
                this.CountHeight(root.right),
                this.CountHeight(root.left)
            ) + 1;
        return root.height;
    }

    TreeToHTML(root) {
        function GetGetContent(instance, root) {
            var root = root;
            var instance = instance;
            return function (node) {
                var content = instance.TreeToHTML(node);
                if (instance.GetArity(root.operation) == 1) {
                    return `(${content})`;
                }
                if (
                    node.var_name != undefined ||
                    root.operation == "/" ||
                    node.operation == "^" ||
                    node.operation == "sqrt"
                ) {
                    return content;
                }
                if (node.priority > root.priority) {
                    return `(${content})`;
                }
                return content;
            };
        }

        var GetContent = GetGetContent(this, root);

        if (root.var_name != undefined) {
            function VarDiv(var_name) {
                var div = "";
                for (let letter of var_name) {
                    if (letter == "$") {
                        div += `<div class="dollar_sign">$</div>`;
                    } else {
                        div += letter;
                    }
                }
                return div;
            }
            return `<div class="var">${VarDiv(root.var_name)}</div>`;
        }

        var op_name = this.op_names[this.operations.indexOf(root.operation)];

        var op_symbol = root.operation;
        if (this.pretty_converter[root.operation] != undefined) {
            op_symbol = this.pretty_converter[root.operation];
        }

        if (this.GetArity(root.operation) == 1) {
            return (
                `<div class="oper oper_${op_name}">` +
                `<div class="oper_symbol oper_${op_name}_symbol">` +
                op_symbol +
                "</div>" +
                `<div class="oper_right oper_${op_name}_right">` +
                GetContent(root.right) +
                "</div>" +
                "</div>"
            );
        }

        return (
            `<div class="oper oper_${op_name}">` +
            `<div class="oper_left oper_${op_name}_left">` +
            GetContent(root.left) +
            `</div>` +
            `<div class="oper_symbol oper_${op_name}_symbol">` +
            op_symbol +
            `</div>` +
            `<div class="oper_right oper_${op_name}_right">` +
            GetContent(root.right) +
            `</div>` +
            "</div>"
        );
    }
}

parser = new ExpParser();
input = document.querySelector("input");
output = document.querySelector("#exp_answer");

exp = parser.ToExp(input.value);
tree = parser.TreeFromExp(exp);
console.log(tree);
output.innerHTML = parser.TreeToHTML(tree);

input.addEventListener("change", function () {
    exp = parser.ToExp(input.value);
    tree = parser.TreeFromExp(exp);
    console.log(parser.TreeToHTML(tree));
    output.innerHTML = parser.TreeToHTML(tree);
});
