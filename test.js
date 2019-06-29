import dsv from './src/dsv.js'
import autoType from "./src/autoType.js"
var trydsv = dsv(",");
var text2string=[
    {"Year": "199,7", "Make": "Ford", "Model": "E350", "Length": "2.34"},
    {"Year": "2000", "Make": "Mercury", "Model": "Cougar", "Length": "2.38"}
];
var format = trydsv.format(text2string);
console.log(format);

let formatBody = trydsv.formatBody(text2string);
console.log(formatBody);

var text2notitle=[
    ["1997", "Ford", "E350", "2.34"],
    ["2000", "Mer\ncury", "Cougar", "2.38"]
];
let formatRows = trydsv.formatRows(text2notitle);
console.log(formatRows);


/*下面测试parse*/
let text= "Year,Make,Model,Length\n" +
    "1997,Ford,E350,2.34\n" +
    "2000,Mercury,Cougar,2.38";
let parse = trydsv.parse(text);
console.log(parse);


console.log(autoType({a:"a123"}));