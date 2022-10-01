import fetch from 'node-fetch';
import express from  'express'
import mongoose from  'mongoose'

import dotenv from 'dotenv'
dotenv.config()
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }))

//to start the server
app.listen(process.env.PORT || 3000, (err) => {
    if (!err) {
        console.log("Server Started");
    } else {
        console.log(err);
    }
});

const ethereumPriceSchema = mongoose.Schema({ 
    productName :{ type: String }  ,
    price :{ type: Number } ,
})
const dataSchema = new mongoose.Schema({
    
    blockNumber :{ type: String }  ,
    timeStamp :{ type: String } ,
    hash :{ type: String } ,
    nonce :{ type: String } ,
    blockHash :{ type: String } ,
    transactionIndex :{ type: String } ,
    from :{ type: String } ,
    to :{ type: String } ,
    value :{ type: String } ,
    gas :{ type: String } ,
    gasPrice :{ type: String } ,
    isError :{ type: String } ,
    txreceipt_status :{ type: String } ,
    input :{ type: String } ,
    contractAddress :{ type: String } ,
    cumulativeGasUsed :{ type: String } ,
    gasUsed :{ type: String } ,
    confirmations :{ type: String } ,
    methodId :{ type: String } ,
    functionName :{ type: String } ,
    
    
});

const ethereumPriceModal = mongoose.model("ethereumPrice", ethereumPriceSchema);
const dataModal = mongoose.model("data", dataSchema);


// to fetch data from api and store in  the database
app.post("/adddata", async (req, res) => {
//  async function getData(){

    fetch(process.env.API_URI)
  .then(response => response.json())
  .then(allData => {
    allData.result.forEach((data)=>{
        dataModal.find({ blockNumber: data.blockNumber }).then((blockDataRecord) => {
            if (blockDataRecord.length) {
                dataModal.find({ transactionIndex: data.transactionIndex }).then((transactionDataRecord) => {
                    if (transactionDataRecord.length) {
                        
                        console.log("data already exist similar block number and transaction index")
                    }else{
                        new dataModal({
                            blockNumber :data.blockNumber ,
                            timeStamp :data.timeStamp,
                            hash :data.hash,
                            nonce :data.nonce,
                            blockHash :data.blockHash ,
                            transactionIndex :data.transactionIndex ,
                            from :data.from,
                            to :data.to,
                            value :data.value,
                            gas :data.gas,
                            gasPrice :data.gasPrice,
                            isError :data.isError,
                            txreceipt_status :data.txreceipt_status,
                            input :data.input,
                            contractAddress :data.contractAddress,
                            cumulativeGasUsed :data.cumulativeGasUsed,
                            gasUsed :data.gasUsed,
                            confirmations :data.confirmations,
                            methodId :data.methodId,
                            functionName :data.functionName,
                        }).save();
                    }
                    
                }).catch((err)=>{
                    console.log(err)
                })
            }else{
                new dataModal({
                    blockNumber :data.blockNumber ,
                    timeStamp :data.timeStamp,
                    hash :data.hash,
                    nonce :data.nonce,
                    blockHash :data.blockHash ,
                    transactionIndex :data.transactionIndex ,
                    from :data.from,
                    to :data.to,
                    value :data.value,
                    gas :data.gas,
                    gasPrice :data.gasPrice,
                    isError :data.isError,
                    txreceipt_status :data.txreceipt_status,
                    input :data.input,
                    contractAddress :data.contractAddress,
                    cumulativeGasUsed :data.cumulativeGasUsed,
                    gasUsed :data.gasUsed,
                    confirmations :data.confirmations,
                    methodId :data.methodId,
                    functionName :data.functionName,
                }).save();
            }           
        }).catch((err)=>{
            console.log(err)
        })

    })
    res.status(200).send("data inserted to the  db")
  })
  .catch(err =>console.log(err))
 

})

 
//co connect to mongodb
const mongoURL = process.env.ATLAS_URI
 mongoose.connect(mongoURL, () => {
    console.log("Connected to db")
}, (err) => {
    console.log(err);
});

app.get("/", (req, res) => {
   res.status(200).send("KoinX Base route")
})

//list of transactions for a given address.
app.get("/transactionList/*", (req, res) => {
    
    dataModal.find({to : req.query.address} ).then((data) => {
        res.status(200).json({
            TransactionList: data
        })
    })

    // dataModal.find({to : req.params.address} ).then((data) => {
    //     res.status(200).json({
    //         TransactionList: data
    //     })
    // })

})


/*
Build a system within the same server to fetch the price of Ethereum every 10
minutes and store it in the database.
*/
//price update function
async function  updatePrice (){
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&amp;vs_currencies=inr')
    .then(response => response.json())
    .then((allData) => {
        
        ethereumPriceModal.find({productName:"ethereum"}).then((productData)=>{
            if(productData.length){
                ethereumPriceModal.updateOne({productName: "ethereum" }, {
                    price: allData.ethereum.inr,
                    
                }).then((updatedData) => {
                   console.log("lattestt price : " + allData.ethereum.inr +  " is updated for ethereum in db at " + new Date());
                 
                })
            }else{
                new ethereumPriceModal({
                    productName : "ethereum",
                    price : allData.ethereum.inr,
                }).save()

                console.log("added")
            }

        }).catch((err)=>
        console.log(err))
   
    })
    .catch(err =>console.log(err))
}

//calling price update function every 10 mins
setInterval(updatePrice, 600000);


//get api to fetch balance and current price
app.get("/balance/*", (req, res) => {
    let balance =0
      let currPrice =0
       ethereumPriceModal.find().then((priceData)=>{
         currPrice = priceData[0].price;
     
    }).then(()=>{
        
        dataModal.find({to : req.query.address} ).then((transactiondata) => {
           
            transactiondata.forEach((element)=>{
            balance = balance + parseInt(element.value)
          
           })
          
        }).then(()=>{
            dataModal.find({from : req.query.address} ).then((transactiondata) => {
           
                transactiondata.forEach((element)=>{
                balance = balance - parseInt(element.value)
               
               })
               res.status(200).json({
                Balance: balance,
                LatestPrice : currPrice,
            })
               
            }).catch(err=>console.log(err))
    
           
           }).catch(err=>console.log(err))

       

    }

    ).catch(err=> {
        res.status(400).send("some error occured")
        console.log(err)
    })

    // dataModal.find({to : req.params.address} ).then((data) => {
    //     res.status(200).json({
    //         TransactionList: data
    //     })
    // })

})