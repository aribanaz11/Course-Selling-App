const { Router } = require("express");
const courseRouter = Router();

courseRouter.post("/purchase", function(req,res){
    res.json({
        messsage : "course purchased successfully"
    })
})

courseRouter.get("/preview",function(req,res){
     res.json({
        message: "course preview sucessfully"
     })
})

module.exports = {
    courseRouter: courseRouter
}