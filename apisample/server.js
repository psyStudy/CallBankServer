var myfunctions = require('./myfunctions');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path : path.resolve(__dirname, '.env')});
const morgan = require('morgan');
const request = require('request');

/*0. express 서버 만들기 - express 불러오기 */
const express = require('express');
const app = express();


/*1. 포트 설정*/
/*app.set은 전역으로 실행*/
app.set('port', process.env.PORT || 8080);
//app.set('views', path.join(__dirname, 'views')); 

/*2. 공통 미들웨어 설정 */
/*app.use은 지역(?)으로 실행*/
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));//post도 다 받기

/*3. 라우팅 */
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/snd2', (req, res) => {
    res.sendFile(__dirname + '/secretindex.html');
});

//토큰 받기
app.get('/snd', function(req, res){
    console.log(req.query);
    var authCode = req.query.code;
    console.log(authCode);
    var option = {
        method : "POST",
        url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
        header : {
            'Content-Type' : 'application/x-www-form-urlencoded'
        },
        form : {
            code : process.env.Access_Token,
            client_id : process.env.MyTelClientID, 
            client_secret : process.env.MYTelClientSecret,
            redirect_uri : 'http://localhost:8080/snd',
            grant_type : 'authorization_code'
        }
    }
    // resultChild 호출해서 얻은 토큰 정보를 사이트에 입력
    request(option, function (error, response, body) {
        console.log(body);
        var requestResultJSON = JSON.parse(body);
        res.json({'data' : requestResultJSON})
        console.log({'data' : requestResultJSON})
    });
})

//기능1. 사용자 정보조회 = 등록 계좌정보 조회
app.get('/list', function(req, res){
    //금결원 api에 요청보내기
    var option = {
        url : "https://testapi.openbanking.or.kr/v2.0/user/me",
        headers : {
            'Authorization' : 'Bearer ' + process.env.Access_Token
        },
        qs : {
            user_seq_no : process.env.MySeqNo
        }
    }

    //결과 파싱후 응답 보내기
    request.get(option, function (error, response, body) {
        //콜백함수
        var json = JSON.parse(body);
        if (json.rsp_code[0]==='O'){
            res.json(json);
        }else{
            const resultslist = json.res_list;
            const tmplist = [];
            for( const [key, value] of Object.entries(resultslist)) {
                let tmp = {};
                tmp['account_alias'] = value.account_alias;
                tmp['bank_name'] = value.bank_name;
                tmp['account_num_masked'] = value.account_num_masked;
                tmplist.push(tmp);
            }
            const ress = {"res_list" : tmplist};
            res.json(ress);
        }
    });
})
app.get('/withdraw', function(req, res){
    res.sendFile(__dirname + '/withdraw.html');
})

//기능2. 출금이제 API(실계좌)
app.post('/withdraw', function(req, res){
    const item = req.body;
    //console.log(item);
    // 현재는 금결원 출금이체 API 사용 불가
    // var option = {
    //     url : 'https://testapi.openbanking.or.kr/v2.0/transfer/withdraw/acnt_num',
    //     mehtod: 'POST',
    //     headers : {
    //         'Authorization' : "Bearer "+ process.env.Access_Token
    //     },
    //     body:{
    //         bank_tran_id : process.env.dldydrlrhkszhem + "U" + myfunctions.generateRandomCode(9),
    //         cntr_account_type : "N",
    //         cntr_account_num : process.env.MySeqNo,
    //         dps_print_content : item.memo,
    //         wd_bank_code_std : "097", //은행 코드번호
    //         wd_account_num : item.account_num,
    //         tran_amt : item.amount,
    //         user_seq_no : process.env.MySeqNo,
    //         tran_dtime : myfunctions.getDateStr(),//요청일시
    //         req_client_name : "홍길동",
    //         req_client_num : "HONGGILDONG1234",
    //         transfer_purpose : "TR"
    //     },
    //     json:true
    // }
    
    // request.post(option, function (error, response, body) {
    //     console.log(body);
    //     if (body.rsp_code[0]==='O'){
    //         res.json(JSON.parse('{"rsp_cd" : "0", "rsp_msg" : "error"}'))
    //     }else{
    //         res.json(JSON.parse('{"rsp_cd" : "1","rsp_msg" : "success"}'))
    //     }
    // });
    
    //쿼리값이 맞으면, ok, 틀리면 오류처리
    let check = new Boolean(true);
    const maxTransfer_limit = 50000000; //1회 이체한도 : 5천만원
    let errmsg = 'error';
    
    //1.계좌번호가 숫자 인지 확인
    if (isNaN(item.account_num)){
        check = false; /*isNaN은 숫자가 아닐경우 true반환*/
        errmsg = '계좌번호 형식 확인(숫자로만 입력).';
    }else{
        var account_num = Number(item.account_num);
        if(Number.isInteger(account_num)){
            var account_digit = item.account_num.toString().length;
            var acdigit = account_num.toString().length;
            var digitcheck = account_digit - acdigit;
            if (digitcheck > 0 ){
                // 계좌번호 범위가 10~14자리 인지 확인
                if (account_digit < (10-digitcheck) || account_digit > (14-digitcheck)){ 
                    check = false;
                    errmsg = '계좌번호 자릿수 확인(10자리 이상 14자리 이내)';
                    console.log(account_digit);
                    console.log(account_num);
                }
            }else{
                // 계좌번호 범위가 10~14자리 인지 확인
                if (account_digit < 10 || account_digit > 14){ 
                    check = false;
                    errmsg = '계좌번호 자릿수 확인(10자리 이상 14자리 이내)'
                    console.log(account_digit);
                    console.log(account_num);
                }
            }
        }
    }
    
    //2. amount가 숫자인지 확인
    if (isNaN(item.amount)){
        check = false;
        errmsg = '이체값을 확인하세요';
    }else{//숫자면 정수가 맞는지, 음수는 아닌지 확인
        var amount = Number(item.amount)
        if(Number.isInteger(amount)){ //정수라면
            if(amount <= 0){
                check = false;
                errmsg = '이체값이 음수거나 0입니다.';
            } //음수아니면 ok
        }else{ //정수가 아님
            check = false;
            errmsg = '이체값이 정수가 아닙니다.';
        }
        //이체 한도 범위에 들어오는 지 확인
        if (amount > maxTransfer_limit ){ 
            check = false;
            errmsg = '1회 이체한도를 넘었습니다.(이체한도 : ' + maxTransfer_limit + '원)';
        }
    }
    
    //응답보내기.
    if(check){
        res.json(JSON.parse('{"rsp_cd" : "1", "rsp_msg" : "success"}'));
    }else{
        res.json({"rsp_cd" : "0", "rsp_msg" : errmsg });
    }
    
})
//기능3. 잔액조회 API
app.get('/balance/fin_num', function(req, res){
    var option = {
        url : `https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num`,
        headers : {
            "Authorization" : "Bearer "+ process.env.Access_Token
        },
        qs : {
            bank_tran_id : process.env.dldydrlrhkszhem + "U" + myfunctions.generateRandomCode(9),
            fintech_use_num : process.env.fintech_use_num,//핀테크이용번호
            tran_dtime : myfunctions.getDateStr()//요청일시
        }
    }
    //응답 보내고 결과 파싱
    request.get(option, function (error, response, body) {
        var json = JSON.parse(body);
        if (json.rsp_code[0]==='O'){
            res.json(json);
        }else{
            const tmpobj = {};
            tmpobj['bank_name'] = json.bank_name;
            tmpobj['balance_amt'] = json.balance_amt;
            res.json(tmpobj);
        }
    });
})

//기능4. 거래내역조회 API
app.get('/transaction-list/fin_num/', function(req, res){
    const q = req.query;
    var option = {
        url : "https://testapi.openbanking.or.kr/v2.0/account/transaction_list/fin_num",
        headers : {
            'Authorization' : "Bearer " + process.env.Access_Token
        },
        qs : {
            // U: 이용기관에서 생성한 은행거래고유번호, O: 오픈뱅킹에서 생성한 은행거래고유번호
            bank_tran_id : process.env.dldydrlrhkszhem + "U" + myfunctions.generateRandomCode(9),
            fintech_use_num : process.env.fintech_use_num,//핀테크이용번호
            inquiry_type : "A",//all
            inquiry_base : "D",//일자기준
            from_date : q.from_date,
            to_date : q.to_date ,
            sort_order : "D",//내림차순
            tran_dtime : myfunctions.getDateStr(),
            befor_inquiry_trace_info : "123",
        }
    }
    //응답 보내고 결과 파싱
    request.get(option, function (error, response, body) {
        var json = JSON.parse(body);
        if (json.rsp_code[0]==='O'){
            res.json(json);
        }else{
            const resultslist = json.res_list;//거래된 조회내역
            const tmplist = [];
            for( const [key, value] of Object.entries(resultslist)) {
                let tmp = {};
                tmp['tran_date'] = value.tran_date;
                tmp['inout_type'] = value.inout_type;
                tmp['tran_amt'] = value.tran_amt;
                tmp['after_balance_amt'] = value.after_balance_amt;
                tmplist.push(tmp);
            }
            const tmpobj = {};
            tmpobj['bank_name'] = json.bank_name;
            tmpobj['balance_amt'] = json.balance_amt;
            tmpobj['res_list'] = tmplist;
            res.json(tmpobj);
        }
    });
})

/* 5. 404 처리 미들웨어 구성 */
// app.get((req, res)=>{
//     res.status(404).send('not found');
// })
app.use((req, res, next) => {
    res.status(404).send('<h1>Page not found(404)</h1>');
})
/* 6. 오류 처리 미들웨어 구성*/
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('<h1>500 Server Error</h1>');
});

/* 7. 서버가 포트를 리스닝*/
app.listen(app.get('port'), () => {
    console.log(app.get('port'), 'empty port server inging :-)');
});