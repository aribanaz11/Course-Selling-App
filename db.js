const { Schema } = require ("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.type.ObjectId;

const userSchema = Schema ({
    email :{
        type:String,
        unique: true },
    password :String,
    firstName : String,
    lastName : String,
});

const adminSchema = Schema({
    email:{ type: String, unique:true },
    password :String,
    firstName : String,
    lastName : String,
});

const courseSchema = Schema ({
    title: String,
    description: String,
    price : Number,
    imageUrl: String,
    createId: ObjectId,
});

const purchaseSchema = Schema ({
    userId : ObjectId,
    courseId : ObjectId,
});

const userModel = mongoose.model("user", userSchema);
const adminModel = mongoose.model("user", adminSchema);
const courseModel = mongoose.model("user", courseSchema);
const purchaseModel = mongoose.model("user", purchaseSchema);

module.exports = {
    userModel,
    adminModel,
    courseModel,
    purchaseModel
}