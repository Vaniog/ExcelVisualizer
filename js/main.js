var OpGet = {
    op_names: {
        "+": "plus",
        "-": "minus",
        "*": "mult",
        "/": "divide",
        sqrt: "sqrt",
        КОРЕНЬ: "sqrt",
        SQRT: "sqrt",
        "^": "pow",
        СТЕПЕНЬ: "pow",
        POW: "pow",
        sum: "sum",
        SUM: "sum",
        СУММ: "sum",
        aver: "aver",
        AVERAGE: "aver",
        СРЗНАЧ: "aver",
    },

    priors: {
        plus: 0,
        minus: 0,
        mult: 1,
        divide: 1,
        sqrt: 2,
        pow: 3,
        sum: 3,
        aver: 3,
    },

    arities: {
        plus: 2,
        minus: 2,
        mult: 2,
        divide: 2,
        sqrt: 1,
        pow: 2,
        sum: 1,
        aver: 1,
    },

    pretties: {
        plus: "+",
        minus: "-",
        mult: "·",
        divide: "/",
        sqrt: "√",
        pow: "",
        sum: "Σ",
        aver: "aver",
    },

    TryConvert: function (val, arr) {
        if (arr[val] != undefined) return arr[val];
        return val;
    },

    GetArity: function (val) {
        return this.TryConvert(val, this.arities);
    },
    GetPrior: function (val) {
        return this.TryConvert(val, this.priors);
    },
    IsOperation: function (symbol) {
        return this.op_names[symbol] != undefined;
    },
};

class Operation {
    constructor(op, bracket_depth = 0) {
        function TryConvert(val, arr) {
            if (arr[val] != undefined) return arr[val];
            return val;
        }
        this.type = "operation";
        this.op_name = TryConvert(op, OpGet.op_names);
        this.priority = TryConvert(this.op_name, OpGet.priors) + bracket_depth;
        this.arity = TryConvert(this.op_name, OpGet.arities);
        this.pretty = TryConvert(this.op_name, OpGet.pretties);
    }
}

class ExpParser {
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
                    var new_op = new Operation(var_name, bracket_depth);
                    if (new_op.arity == 1 || new_op.arity == undefined) {
                        exp.push(new_op);
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
                let priority = OpGet.GetPrior(
                    op_stack[op_stack.length - 1].var_name
                );
                exp.push(
                    new Operation(
                        op_stack.pop().var_name,
                        bracket_depth - prior_for_bracket
                    )
                );
                continue;
            }

            if (!OpGet.IsOperation(exp_char)) {
                var_name += exp_char;
                continue;
            }

            // exp_char is operation
            VarNamePush();

            exp.push(new Operation(exp_char, bracket_depth));
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
                if (exp[i].type == "var" || exp[i].priority <= to_do.priority)
                    continue;

                (to_do.index = i), (to_do.priority = exp[i].priority);
            }

            let index = to_do.index;
            let rh = undefined;
            let rh_ind = -1;
            let lh = undefined;
            let lh_ind = -1;

            if (exp[index].arity != 1) {
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
                operation: exp[index],
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
                if (node.operation == undefined) return content;
                if (root.operation.arity == 1) {
                    var op_name = node.operation.op_name;

                    var bracket_open = `<div class="bracket bracket_${op_name} bracket_open bracket_${op_name}_open">(</div>`;
                    var bracket_close = `<div class="bracket bracket_${op_name} bracket_close bracket_${op_name}_close">)</div>`;

                    return `${bracket_open}${content}${bracket_close}`;
                }
                if (
                    node.var_name != undefined ||
                    root.operation.op_name == "divide" ||
                    node.operation.op_name == "pow" ||
                    node.operation.op_name == "sqrt"
                ) {
                    return content;
                }
                if (node.operation.priority > root.operation.priority) {
                    var op_name = node.operation.op_name;

                    var bracket_open = `<div class="bracket bracket_${op_name} bracket_open bracket_${op_name}_open">(</div>`;
                    var bracket_close = `<div class="bracket bracket_${op_name} bracket_close bracket_${op_name}_close">)</div>`;

                    return `${bracket_open}${content}${bracket_close}`;
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

        var op_name = root.operation.op_name;
        var op_symbol = root.operation.pretty;

        if (root.operation.arity == 1) {
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
example_btn = document.querySelector("#example_btn");

if (input.value != "") {
    exp = parser.ToExp(input.value);
    tree = parser.TreeFromExp(exp);
    console.log(tree);
    output.innerHTML = parser.TreeToHTML(tree);
}

input.addEventListener("change", function () {
    exp = parser.ToExp(input.value);
    tree = parser.TreeFromExp(exp);
    console.log(parser.TreeToHTML(tree));
    output.innerHTML = parser.TreeToHTML(tree);
});

example_btn.addEventListener("click", function () {
    input.value =
        "=R16 * КОРЕНЬ(СТЕПЕНЬ($K9 / $L9;2) + СТЕПЕНЬ($I$3/$I$2;2) + СТЕПЕНЬ(R11 /($O$2 - R10);2))";
    input.dispatchEvent(new Event("change"));
});
