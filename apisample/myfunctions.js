module.exports = {
    getDateStr : function(){
        const date = new Date();
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        const seconds = ('0' + date.getSeconds()).slice(-2);
        const dateStr = year + month + day+hours+minutes+seconds;
        //console.log(dateStr);
        return dateStr;
    },
    generateRandomCode: function(n) {
        let str = ''
        for (let i = 0; i < n; i++) {
          str += Math.floor(Math.random() * 10)
        }
        return str
    }
}
