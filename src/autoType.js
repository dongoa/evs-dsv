export default function autoType(object){
    for(var key in object){
    let value = object[key].trim(),number;
    //stringObj.trim() 从字符串中移除前导空格、尾随空格和行终止符
        if(!value) value=null;
        else if(value === "true") value=true;
        else if(value === "false") value=false;
        else if(value === "NaN") value=NaN;
        else if(!isNaN(number = +value)) value=number;
        else if(/^([-+]\d{2})?\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[-+]\d{2}:\d{2})?)?$/.test(value)) {
            value = new Date(value);
        }
        else continue;
        object[key]=value;
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
    }
    return object;
}