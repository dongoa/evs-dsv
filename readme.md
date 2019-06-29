# evs-dsv
改模块为文本分隔符分隔进行解析，常见的数据格式为逗号分隔的csv文件或制表符分割的tsv文件，这些表格非常受excel欢迎，而且比json更节省空间，代码实现基于论文[RFC 4180](https://tools.ietf.org/html/rfc4180)Common Format and MIME Type for Comma-Separated Values (CSV) Files.  

# API参考与算法解析：  
### evs.dsvFormat(delimiter):  
为指定的dsv构造一个新的dsv解析器和格式化程序，分割符必须为单个字符，如ASCII码  

### dsv.parse(string[, row])
解析指定的字符串，该字符串要采用带有相应分隔符值的格式，返回解析后的对象数组。  

该方法不同于dsv.parseRows,该方法要求DSV内容的第一行包含以分隔符分隔的列名列表，例如：  
```
Year,Make,Model,Length
1997,Ford,E350,2.34
2000,Mercury,Cougar,2.38
```
解析后的js数组为：  
```
[
  {"Year": "1997", "Make": "Ford", "Model": "E350", "Length": "2.34"},
  {"Year": "2000", "Make": "Mercury", "Model": "Cougar", "Length": "2.38"}
]
```
另外对于row转换函数，如果未指定则字段值都为字符串类型，为了安全起见不会转换为数字、日期或其他类型。(在某些情况下，Javascript可能会自动将字符串强制转换为数字，例如使用+运算符的时候，这是原生Js的内容了)。但是最后是指定这样一个转换函数，此外，本模块中还写了以一个接口实现自动的转化函数，推断和胁迫强制类型的转换。  

如果你指定了一个行转换函数，则会为每一行调用指定的函数，得到一个表示当前行的d对象以及下标i从0开始的项，如果遇到空或undefined程序会自动忽略。一个传入行转换函数的用法是这样的(结合上面的数组去理解)：  
```
var data = d3.csvParse(string, function(d) {
  return {
    year: new Date(+d.Year, 0, 1), // lowercase and convert "Year" to Date
    make: d.Make, // lowercase
    model: d.Model, // lowercase
    length: +d.Length // lowercase and convert "Length" to number
  };
});
```
d3中也提到一点:使用+而不是parseInt或ParseFloat通常更快，但是具有限制性，如使用+强制执行“30px”时的返回结果是NaN，另外两个函数返回30。

### dsv.parseRows(string[, row])  
解析指定的字符串，该字符串必须使用适当的分隔符分隔值格式，与dsv.parse不同，该方法处理没有header的情况，将每行转化为数组而不是对象，请看如下样例：  
```
1997,Ford,E350,2.34
2000,Mercury,Cougar,2.38
```
得到的结果为：  
```
[
  ["1997", "Ford", "E350", "2.34"],
  ["2000", "Mercury", "Cougar", "2.38"]
]
```
同样的在不指定转换函数的情况下字段值为字符串，更好的方法使用autoType,传入一个行转换函数的样例：  
```
var data = d3.csvParseRows(string, function(d, i) {
  return {
    year: new Date(+d[0], 0, 1), // convert first colum column to Date
    make: d[1],
    model: d[2],
    length: +d[3] // convert fourth column to number
  };
});
```


### dsv.format(rows[, columns])：  
讲javascript对象数组转化为指定分隔符的字符串，这个操作其实就是dsv.parse的逆操作，行与行之间用\n分隔，列之间用分隔符分割,包含分隔符，双引号（“）或换行符的值将使用双引号进行转义。  

如果为指定colums,则标题行顺序不确定，colums用来指定标题和顺序  
用法示例：  
```
var string = d3.csvFormat(data, ["year", "make", "model", "length"]);
```
每个行对象上的所有字段都被转换为字符串，如果字段值为null或未定义，则使用空字符串，如果字段是Date，使用ECMAScript日期时间字符串格式。代码中为了更好的控制字段的格式和方式，首先将行映射到字符串数组，然后使用dsv.formatRows.  

### dsv.formatBody(rows[, columns]):
忽略标题行的dsv.format的结果，这个接口在将行附加到现有文件时非常有用  

### dsv.formatRows(rows) :  
是dsv.parseRows的逆操作，将每行以换行符分隔，每行中的每列由分隔符分隔，双引号或换行符的值将使用双引号进行转义  
可以使用map显示的转换原始对象数组的值，如下：  
```
var string = d3.csvFormatRows(data.map(function(d, i) {
  return [
    d.year.getFullYear(), // Assuming d.year is a Date object.
    d.make,
    d.model,
    d.length
  ];
}));
```
也可以使用concat添加一行标题：  
```
var string = d3.csvFormatRows([[
    "year",
    "make",
    "model",
    "length"
  ]].concat(data.map(function(d, i) {
  return [
    d.year.getFullYear(), // Assuming d.year is a Date object.
    d.make,
    d.model,
    d.length
  ];
})));
```
###  d3.autoType(object) ：  
在解析文本的时候，默认全部是字符串，或者用户可以自定义类型的转换，此函数设置了一些转换类型，方便直接使用，推断对象上的值类型并相应地强制他们转换，举个例子：下面的csv文件，使用该函数后，对应的数字型解析后变为数字型：  
```
Year,Make,Model,Length
1997,Ford,E350,2.34
2000,Mercury,Cougar,2.38
```
使用evs.csvParse:  
```
d3.csvParse(string, d3.autoType)
```
得到的对象数字：  
```
[
  {"Year": 1997, "Make": "Ford", "Model": "E350", "Length": 2.34},
  {"Year": 2000, "Make": "Mercury", "Model": "Cougar", "Length": 2.38}
]
```
计算原理就是加判断：  
1. 空，返回null
2. "true",返回true
3. "false",返回false
4. "NaN", 返回NaN
5. 判断是否为数字[ECMA链接](https://www.ecma-international.org/ecma-262/9.0/index.html#prod-StringNumericLiteral),返回数字
6. [判断日期](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-date-time-string-format)，返回日期对象
7. 返回原始字符串  
该方法自动忽略前导零，"09"->"9",对于有其他字符的数字，会转化为字符串"$123"->"$123"  
对日期来说，要符合ECMAScript的ISO 8601格式，指定为YYYY-MM-DD时，默认为午夜UTC时间，如果没有时区(如YYYY-MM-DDTHH：MM)，假定本地时间。当然除了使用该函数，也完全可以使用自己的类型转换函数  

# 总结： 
dsv.format()、dsv.formatBody()、dsv.formatRows()这三个api作用就是将对象数组转化为不同设定的分隔符的文本，其中有一个columns函数可以修改每一行的值，在源码中抽象出了几个可以复用的函数：  
比较复杂的是**formatValue()**,对值进行判断，对不同空值、日期对象、含有分隔符转义字符使用添加双引号，然后在join(分隔符)，其中换有将日期对象处理成字符串的的函数formatDate,用到date.getUTC...函数，pad()作用是某个日期不满足长度往前面补零.这里format的重点也就是这个函数，看懂这里就明白他怎么写的了  
换有一个是计算出所有标题数组的inferColumns()  
dsv.parse()、dsv.parseRows()这两个函数的作用就将带有分隔符的text转对象数组和数组的数组，dsv.parse()根据dsv.parseRows实现，区别在于是否处理标题行的问题，非常巧妙的利用return，convert不初始化的办法，将标题行第一次初始化，这段代码如下：  
```
function parse(text,f){
		// console.log(text);
		var convert,columns,rows=parseRows(text,(row,i)=>{
			// console.log(row);
			if(convert) return convert(row,i-1);//第一行convert是没有初始化的，所以标题行会忽略掉,
			columns=row,convert=f?customConverter(row,f):objectConverter(row);//这个函数只执行一次，相当于保存标题行和添加convert转换函数，非常巧妙
		});
		rows.columns=columns || [];
		return rows;
	}
```
主要的解析步骤在parseRows里，代码中利用初始化两个空对象表示标识，来判断不同的情况，虽然后空对象，但是可以区分不同的状态，解析步骤为3步：1.处理掉双引号，csv文件在生成时可能会自动出现双引号，第二步，通过找下一个标识符找到一个值，第三步，处理这一行，直至遇到EOL行的结尾，其中f在标题行是没有传入的，n记录使用过f的行数，而且换把结果为null的行忽略掉了。总之用了许多的回调函数。其内部也声明了token()函数，找到下一个分隔符的值，核心处理的代码片段如下：  
```
while((t=token()) !== EOF){
			console.log(t);
			var row = [];
			while(t !== EOL && t !== EOF) row.push(t), t=token();
			if(f && (row = f(row,n++)) == null) continue;//n++表示从
			rows.push(row);
		}
```

在autoType中，用到了正则去判断符合日期模式的字符串：  
```
 else if(/^([-+]\d{2})?\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[-+]\d{2}:\d{2})?)?$/.test(value)) {
            value = new Date(value);
        }
        /*这里要复习一下正则了
            *^开头
            *[]匹配任意一个字符，可以使用链接符号-
            * \d匹配数字
            * {n}匹配n次
            * ?匹配0次或1次
            *$匹配结尾
            *
            * ^([-+]\d{2})? 这里含义可以是-+两个数字开头
            * \d{4}(-\d{2}(-\d{2})?)? 然后1111(必须)-可选-11-11
            *
            * (T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?
            * 以T开头 T11：11：11.111
            *
            * (Z|[-+]\d{2}:\d{2})?)?$
            * 以Z-11:11结尾,可选的
            * */
```
上面5个接口就是最基本的就是最基本的实现，可以自定义一个分隔符，实现文本转对象数组以及对象数组转文本，另外作者添加了2个指定分隔符的接口，方便我们使用，一个时用逗号分隔符,对应csv格式文件：  
### evs.csvParse(string[, row])
对应dsvFormat(",").parse.  
### evs.csvParseRows(string[, row])
对应 dsvFormat(",").parseRows.  
### evs.csvFormat(rows[, columns])
对应 dsvFormat(",").format.  
### evs.csvFormatBody(rows[, columns])
对应 dsvFormat(",").formatBody.  
### evs.csvFormatRows(rows)
对应 dsvFormat(",").formatRows.  
另一个是\t为分隔符的tsv文件：  
### evs.tsvParse(string[, row])
对应 dsvFormat("\t").parse.  
### evs.tsvParseRows(string[, row])
对应 dsvFormat("\t").parseRows.  
### evs.tsvFormat(rows[, columns])
对应 dsvFormat("\t").format.  
### evs.tsvFormatBody(rows[, columns])
对应 dsvFormat("\t").formatBody.  
### evs.tsvFormatRows(rows)
对应 dsvFormat("\t").formatRows.  

此外，作者还实现三个不同格式文本转换的命令行工具，dsv2dsv/dsv2json/json2dsv感兴趣的可以去看代码[格式转换node工具](https://github.com/d3/d3-dsv/tree/master/bin)。

**高层接口**：  
dsv.format()、dsv.formatBody()、dsv.formatRows()这三个函数第一个就是将正常的对象数组转化为自定义分隔符的字符串，第二个忽略计算标题，相当于去掉了标题行，前面也提到了用途就是附加到其他文件时，第三个函数呢就是将二维数组转化为了分隔符的字符串。  
dsv.parse()、dsv.praseRows()这两个函数，parse依赖于praseRows,就是多处理了标题行。  

对于不需要处理复杂数据人使用时，我们完全只需要使用的功能就是将csv文件读入，然后保存为对象数组，只使用evs.csvParse(data)就足够了。  
另外我想了个名字，叫Evs，含义就是easy vis，简单可视化，因为后面有想法写一些更简单使用的接口，或者说魔板页面，让用户轻松实现非常好的效果。  

# 深度阅读：  
new Function()语法：https://www.cnblogs.com/xiaokeai0110/p/10029024.html