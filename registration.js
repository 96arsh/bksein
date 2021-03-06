var express = require('express');
var crypto = require("crypto");
var router = express.Router();
var dateFormat = require('dateformat');
var db = require('./db');
var mail = require('./mail');
const {
    saveuserdata
} = require('./db');
const fetch = require('node-fetch');
var log4js = require("log4js");
log4js.configure({
    appenders: {
        cheese: {
            type: "file",
            filename: "cheese.log"
        }
    },
    categories: {
        default: {
            appenders: ["cheese"],
            level: "debug"
        }
    }
});

const logger = log4js.getLogger("cheese");
router.use(express.urlencoded({
    extended: true
}))


var appId = "13955848b8e5f1cc0e75062f73855931";

var name;
var email;
var phone;
var speciality = {};

var mamount;
var receipt;
router.post('/registrationform', async (req, res) => {


    let name = req.body.name;
    // let email = req.body.email;
    let phone = req.body.phone;
    let receipt;

    mamount = "";
    let username = name.substring(0, 3) + phone;
    let day = dateFormat(new Date(), "yyyymmddhMMss");
    receipt = "order" + name.substring(0, 3) + phone.substring(phone.length - 4) + day;


    let results = await db.checkuser(phone);

    if (results[0] == "Already exist") {
        // logger.debug("my harsh"+results[1].name);

        res.send("Already exist");
    } else {

        // day = dateFormat(new Date(), "yyyymmddhMMss");

        receipt = "order" + name.substring(0, 3) + phone.substring(phone.length - 4) + day;

        //  var username = form[receipt].name.substring(0, 3) + form[receipt].phone;
        savedata(req.body.name, req.body.email, req.body.phone, req.body.age, req.body.speciality, req.body.district, username, receipt, req.body.state);

        CreateOrder(req.body.name, req.body.email, req.body.phone, req.body.age, req.body.speciality, username, receipt).then((data) => {
            logger.debug(data);
            res.send(data);
        });

    }




});

router.post('/feepay', async (req, res) => {



    let phone = req.body.phone;

    logger.debug("MyFee request" + JSON.stringify(req.body));

    let results = await db.checkuser(phone);

    if (results[0] == "Already exist") {

        logger.debug("MyFee result" + results[1].name, results[1].email, results[1].phone, results[1].speciality, results[1].uname, results[1].order_id);
        var day = dateFormat(new Date(), "yyyymmddhMMss");
        receipt = "order" + results[1].name.substring(0, 3) + results[1].phone.substring(results[1].phone.length - 4) + day;
        CreateOrder(results[1].name, results[1].email, results[1].phone, results[1].age, results[1].speciality, results[1].uname, receipt).then((data) => {
            logger.debug(data);
            res.send(data);
        });

        // res.send({ name: results[1].name, email: results[1].email, phone: results[1].phone, receipt: results[1].order_id , speciality: results[1].speciality });
    } else {
        res.send("Please Register Now");

    }



});

async function CreateOrder(name, email, phone, age, speciality, username, receipt) {


    const url = 'https://api.cashfree.com/pg/orders';
    const pro = 'https://api.cashfree.com/pg/orders';
    const options = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'x-client-id': '13955848b8e5f1cc0e75062f73855931',
            'x-client-secret': '7ad867e9521be61754c24072525b8a8ba4d61b4b',
            'x-api-version': '2021-05-21',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            customer_details: {
                customer_name: name,
                customer_id: username,
                customer_email: email,
                customer_phone: phone
            },
            order_meta: {
                return_url: 'https://bkse.in/home/verify?order_id={order_id}&order_token={order_token}',
                notify_url: 'https://bkse.in/home/api/notify/done'
            },
            order_amount: amount(speciality, age),
            order_note: 'Pro order',
            order_currency: 'INR',
            order_id: receipt
        })
    };

    let results = await fetch(url, options)
        .then(res => res.json())
        .then(json => {
            logger.debug(json);

            return json.payment_link;
        })
        .catch(err => console.error('error:' + err));
    return results;
}

router.get('/verify', (req, res) => {

    url = "https://bkse.in/home/api/payment/done";


    res.render('request', {
        url: url
    });

});


// router.post('/test/api/payment/verify', (req, res) => {

//   logger.debug('verify-body: ' + JSON.stringify(req.body));
//   var postData = {
//     "orderId": req.body.orderId,
//     "orderAmount": req.body.orderAmount,
//     "referenceId": req.body.referenceId,
//     "txStatus": req.body.txStatus,
//     "paymentMode": req.body.paymentMode,
//     "txMsg": req.body.txMsg,
//     "txTime": req.body.txTime
//   },
//     secretKey = "7ad867e9521be61754c24072525b8a8ba4d61b4b",

//     signatureData = "";
//   for (var key in postData) {
//     signatureData += postData[key];
//   }
//   var computedsignature = crypto.createHmac('sha256', secretKey).update(signatureData).digest('base64');
//   if (req.body.txStatus == "SUCCESS") {
//     logger.debug("VIP :" + "SUCCESS");
//     if (req.body.signature == computedsignature) {
//       logger.debug("VIP :" + "signature match");
//       // logger.debug("VIP ture is:"+savedata(req.body.orderId, req.body.referenceId, computedsignature).then(x => logger.debug("my xx"+x))); 
//       savepayment(req.body.orderId, req.body.referenceId, computedsignature, req.body.txTime).then(async (data)  => {
//         logger.debug(data);
//         if (data) {
//           logger.debug("VIP :" + "Store Succescfull");
//           postData['txsubmited'] = "true";

//           let getdata = await db.getuserdata(
//             req.body.orderId
//           );

//           if (getdata[0] == "Already exist") {
//               logger.debug("make email");
//             var username = getdata[1].name.substring(0, 3) + getdata[1].phone;
//           makeemail(
//             getdata[1].name,
//             getdata[1].email,
//             getdata[1].phone,
//             getdata[1].age,
//             getdata[1].speciality,
//             getdata[1].district,
//             username,
//             req.body.txTime,
//             amount(getdata[1].speciality),
//             req.body.referenceId
//           ).then((data) => {


//           });
//         }




//           res.render('response', { postData: JSON.stringify(postData) });
//         } else {
//           logger.debug("VIP :" + "Store Faild");
//           postData['txsubmited'] = "false";
//           postData['txMsg'] = "Transaction failed. if your amount has been deducted 4-5 working days will be refunded. "
//           res.render('response', { postData: JSON.stringify(postData) });
//         }
//       });


//     } else {
//       logger.debug("VIP :" + "signature Faild");
//       postData['txStatus'] = "Faild";
//       postData['txsubmited'] = "false";
//       postData['txMsg'] = "Transaction Faild"
//       delete form[req.body.orderId]; 
//       res.render('response', { postData: JSON.stringify(postData) });
//     }


//   } else {
//     logger.debug("VIP :" + "Transaction Faild");
//     delete form[req.body.orderId];  

//     postData['txsubmited'] = "false";
//     res.render('response', { postData: JSON.stringify(postData) });

//   }

// });




router.post('/api/notify/done', (req, res) => {
    logger.debug("Cheese is Comt??. beta server");

    logger.debug('verify-body: ' + JSON.stringify(req.body));
    var postData = {
            "orderId": req.body.orderId,
            "orderAmount": req.body.orderAmount,
            "referenceId": req.body.referenceId,
            "txStatus": req.body.txStatus,
            "paymentMode": req.body.paymentMode,
            "txMsg": req.body.txMsg,
            "txTime": req.body.txTime
        },
        secretKey = "7ad867e9521be61754c24072525b8a8ba4d61b4b",

        signatureData = "";
    for (var key in postData) {
        signatureData += postData[key];
    }
    var computedsignature = crypto.createHmac('sha256', secretKey).update(signatureData).digest('base64');
    if (req.body.txStatus == "SUCCESS") {
        console.log("VIP :" + "SUCCESS");
        if (req.body.signature == computedsignature) {
            console.log("VIP :" + "signature match");

            const basurl = "https://api.cashfree.com/pg/orders/"
            const url = basurl + req.body.orderId;
            // logger.debug('puru-url: ' + url);
            const options = {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'x-client-id': '13955848b8e5f1cc0e75062f73855931',
                    'x-client-secret': '7ad867e9521be61754c24072525b8a8ba4d61b4b',
                    'x-api-version': '2021-05-21'
                }
            };

            fetch(url, options)
                .then(res => res.json())
                .then(json => {
                    savepayment(json.order_id, json.cf_order_id, req.body.signature, json.created_at, json.customer_details.customer_phone).then(async (data) => {
                        logger.debug(data);
                        
                    });
                    
                                 let getdata = mygetdata(json.customer_details.customer_phone);

                            if (getdata[0] == "Already exist") {
                                logger.debug("make email");
                                var username = getdata[1].name.substring(0, 3) + getdata[1].phone;
                                if (!getdata[1].isemailsent) {
                                    logger.debug("make not sent before");
                                    makeemail(
                                        getdata[1].name,
                                        getdata[1].email,
                                        getdata[1].phone,
                                        getdata[1].age,
                                        getdata[1].speciality,
                                        getdata[1].district,
                                        getdata[1].state,
                                        username,
                                        json.created_at,
                                        amount(getdata[1].speciality, getdata[1].age),
                                        json.cf_order_id
                                    ).then((data) => {

                                    });
                                } else {
                                    logger.debug("make  sent before");
                                }
                                saveemail(true, getdata[1].phone);
                    
                    
                })
                .catch(err => console.error('error:' + err));


        } else {
            console.log("VIP :" + "signature Faild");


            // res.render('response', { postData: JSON.stringify(postData) });
        }


    } else {
        console.log("VIP :" + "Transaction Faild");


        // res.render('response', { postData: JSON.stringify(postData) });

    }




});

router.post('/api/payment/done', (req, res) => {

    logger.debug('puru-api: ' + JSON.stringify(req.body));

    var order_id = req.body.orderId;
    var order_token = req.body.token;
    logger.debug('puru-order_id: ' + JSON.stringify(req.body.orderId));
    basurl = "https://api.cashfree.com/pg/orders/"
    const url = basurl + order_id;
    logger.debug('puru-url: ' + url);
    const options = {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'x-client-id': '13955848b8e5f1cc0e75062f73855931',
            'x-client-secret': '7ad867e9521be61754c24072525b8a8ba4d61b4b',
            'x-api-version': '2021-05-21'
        }
    };

    fetch(url, options)
        .then(res => res.json())
        .then(json => {
            logger.debug(json);


            var postData = {
                "orderId": json.order_id,
                "orderAmount": json.order_amount,
                "referenceId": json.cf_order_id,
                "txStatus": json.order_status,
                "txMsg": "Please check you inbox ( if not get email then check in spam mail )",
                "txTime": json.created_at
            }


            if (json.order_status == "PAID") {
                logger.debug("PAID");

                if (json.order_token == order_token) {


                    postData['txsubmited'] = "true";
                    logger.debug("order_token" + JSON.stringify(postData));
                    //   postData['txMsg'] = "Transaction successfull";
                    res.render('response', {
                        postData: JSON.stringify(postData)
                    });

                } else {
                    logger.debug("!!order_token");
                    postData['txsubmited'] = "false";
                    postData['txMsg'] = "Transaction failed. token missmatch ";
                    logger.debug("Cheese is Comt??.111");
                    res.render('response', {
                        postData: JSON.stringify(postData)
                    });
                }
            } else {
                logger.debug("!!PAID");
                postData['txsubmited'] = "false";
                postData['txMsg'] = "Transaction failed."
                res.render('response', {
                    postData: JSON.stringify(postData)
                });
            }
            // savedata(name, email, phone, age, speciality, district, username,receipt)
        })
        .catch(err => console.error('error:' + err));


});


async function mygetdata(phone) {

    // var username = form[orderid].name.substring(0, 3) + form[orderid].phone;

    try {
         let results = await db.getuserdata(phone);

        return results;

    } catch (error) {
        logger.debug("My Error ==" + JSON.stringify(error));
        return error;
    }

}

async function savedata(name, email, phone, age, speciality, district, username, receipt, state) {

    // var username = form[orderid].name.substring(0, 3) + form[orderid].phone;

    try {
        let results = await db.saveuserdata(
            name,
            email,
            phone,
            age,
            speciality,
            district,
            username,
            receipt,
            state
        );

        return results;

    } catch (error) {
        logger.debug("My Error ==" + JSON.stringify(error));
        return error;
    }

}

async function saveemail(isemailsent, phone) {

    // var username = form[orderid].name.substring(0, 3) + form[orderid].phone;

    try {
        let results = await db.saveemail(isemailsent, phone);




        return results;

    } catch (error) {
        logger.debug("My Error ==" + JSON.stringify(error));
        return error;
    }

}


async function savepayment(orderid, refid, signature, time, phone) {


    logger.debug("savepayment" + orderid, refid, signature, time, phone)
    try {
        let results = await db.paymentdata(
            refid,
            orderid,
            signature,
            time,
            phone
        );




        return results;

    } catch (error) {
        logger.debug("My Error ==" + error);

        return error;
    }

}
async function makeemail(name, email, phone, age, speciality, district, state, username, time, amount, refid) {
    logger.debug("makeemail " + name, email, phone, age, speciality, district, username, time, amount);
    try {
        let results = await mail.sendemail(
            name,
            email,
            phone,
            age,
            speciality,
            district,
            state,
            username,
            time,
            amount,
            refid
        );
        return results;
    } catch (error) {
        return error;
    }

}

function amount(speciality, age) {
    var amount = "";
    if (age >= 10 && age <= 15) {
        switch (speciality) {
            case "Bowler":
                amount = "299";
                break;
            case "Batsman":
                amount = "299";
                break;
            case "Wicketkeeper":
                amount = "299";
                break;
            case "All Rounder":
                amount = "499";
                break;
        }
        return amount;

    } else {
        switch (speciality) {
            case "Bowler":
                amount = "599";
                break;
            case "Batsman":
                amount = "599";
                break;
            case "Wicketkeeper":
                amount = "799";
                break;
            case "All Rounder":
                amount = "799";
                break;
        }
        return amount;
    }


}

module.exports = router;