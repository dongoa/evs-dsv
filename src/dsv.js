/*  format部分 */
//计算出所有标题的名字，该方法遍历了所有行的所有项，这样不会有因某一行缺少这个标题而遗漏。
function inferColumns(rows){
	var columnSet = Object.create(null),
	columns=[];

	rows.forEach( (row) => {
		for(let column in row){
			if(!(column in columnSet)){
				columns.push(columnSet[column]=column)
			}
		}
	})
	/*
	这里添加一下Object.create()方法内部实现原理
	funciton create(o){
		function F(){}
		F.prototype=o;
		return new F();
	}
	这里使用Object.create(null)的原因就是它没有任何原型方法，
	如果直接使用{}创建新对象，等同于new Object(),它继承Object有原型
	*/
	return columns;
}
function pad(value,width){
	let s=value+"",length=s.length;
	return length < width ? new Array(width-length+1).join(0)+s:s;//补零
}
function formatYear(year){
	return year < 0 ? "-" + pad(-year,6)
	:year > 9999 ? '+' + pad(year,6)
	:pad(year,4);
}
function formatDate(date){
	var hours=date.getUTCHours(),
		minutes = date.getUTCMinutes(),
		seconds = date.getUTCSeconds(),
		milliseconds = date.getUTCMilliseconds();
	return isNaN(date) ? "Invalid Date"
	: formatYear(date.getUTCFullYear(),4)+"-"+pad(date.getUTCMonth()+1,2)+"-"+pad(date.getUTCDate(),2)
	+(milliseconds?"T"+pad(hours,2)+":"+pad(minutes,2)+":"+pad(seconds,2)+"."+pad(milliseconds,3)+"Z"
	:seconds?"T"+pad(hours,2)+":"+pad(minutes,2)+":"+pad(seconds,2)+"Z"
	:minutes || hours ?"T" + pad(hours,2) + ":"+pad(minutes,2)+"Z"
	:"");
}

/* parse部分 */
var EOL={},//作为一行读取完的标志
	EOF={},//作为整个文件读取完的标志
	QUOTE=34,//引号unicode码
	NEWLINE=10,//换行符
	RETURN=13;//回车

function objectConverter(columns){
    return new Function("d","return {"+ columns.map(function(name, i){
    	return JSON.stringify(name) + ": d[" + i + "]";
	}).join(",")+"}");
}//Function 创建函数时，其上下文不是引用当前的词法环境，而是全局环境
//在实践中，该函数可以在不知道代码是执行字符串创建函数，也可以解决因代码压缩导致的问题(因为Function访问外部变量，压缩后无法找到传入的变量)

function customConverter(columns,f){
	var object=objectConverter(columns);
	return (row,i)=>{
		return f(object(row),i,columns);///这里三个参数类似于row index rows 后面两个是多余的，可能会用到的参数
	}
}
export default function(delimiter){
	/* format部分*/
	var reFormat = new RegExp("[\""+delimiter+"\n\r]"),
	DELIMITER=delimiter.charCodeAt(0);//返回Unicode编码


	function preformatBody(rows,columns){
		return rows.map( (row)=> columns.map( (column) => formatValue(row[column]) ).join(delimiter) );
	}
	//这里是format的入口函数
	function format(rows,columns){
		if(columns == null) columns = inferColumns(rows);
		return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows,columns)).join("\n");
	}
	//导出去掉标题行的文本数据
	function formatBody(rows,columns){
		if(columns == null) columns = inferColumns(rows);
		return preformatBody(rows,columns).join("\n");
	}

	function formatRows(rows){
		return rows.map(formatRow).join("\n");
	}
	function formatRow(row){
		return row.map(formatValue).join(delimiter);
	}
	function formatValue(value){

		var value2= value == null ? ""
		: value instanceof Date ? formatDate(value)
		: reFormat.test(value += "") ? "\""+value.replace(/"/g,"\"\"")+"\"" //对出现分隔符\n\r的值添加双引号
		:value;
        // console.log(value2,reFormat.test(value += ""),"\""+value.replace(/"/g,"\"\"")+"\"","\"");
        return value2;
	}

	/*parse部分**/
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

	function parseRows(text,f){
		var rows=[],//存放输出结果
			N=text.length,
			I=0,//当前字符下标
			n=0,//当前行数
			t,
			eof = N <= 0,//该值判断是否读到文件结束
			eol=false;//停止运行标志

		//第一步，去掉行尾换行符
        // console.log(text.charCodeAt(N - 1));
		if(text.charCodeAt(N - 1)===NEWLINE) --N;
		if(text.charCodeAt(N - 1)===RETURN) --N;

		function token(){
			if(eof) return EOF;
			if(eol) return eol = false, EOL;

			//解码双引号
			let i,j=I,c;
			// console.log(text[j]);
			// console.log(j,text.charCodeAt(j),text[j]);
			if(text.charCodeAt(j)==QUOTE){
				while(I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) == QUOTE);//这句有点绕啊
				if((i=I) >= N) eof=true;
				else if((c=text.charCodeAt(I++)) === NEWLINE) eol=true;
				else if((c===RETURN)) { eol=true; if(text.charCodeAt(I) === NEWLINE) ++I; }
				return text.slice(j+1,i-1).replace(/""/g,"\"");
			}

			//找到下一个分隔符或换行符
			while(I < N){
				if((c = text.charCodeAt(i = I++)) === NEWLINE) eol=true;//如果遇到回车，说明该行结束，eol设为true
				else if(c === RETURN){ eol=true; if(text.charCodeAt(I) === NEWLINE) ++I; }//这里遇到回车，也是改行结束，又加判下一个字符
				else if(c !== DELIMITER) continue;
				return text.slice(j,i);
			}
			return eof = true, text.slice(j,N);
		}

		while((t=token()) !== EOF){
			// console.log(t);
			var row = [];
			while(t !== EOL && t !== EOF) row.push(t), t=token();
			if(f && (row = f(row,n++)) == null) continue;//n++表示从
			rows.push(row);
		}
		// console.log(rows);
		return rows;

	}
	return {
		format:format,
		formatBody:formatBody,
		formatRows:formatRows,
        parse:parse,
        parseRows:parseRows
	}
}