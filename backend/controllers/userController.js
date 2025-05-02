import vaildator from 'validator'
import bcrypt from 'bcrypt'
import User from '../models/user.js';
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import Doctor from '../models/doctor.js';
import Appointment from '../models/appointment.js';
import razorpay from 'razorpay';

// API to register user
export const userRegister = async (req,res) => {
    try {
        const { email, name, password } = req.body;
        
        if(!name || !email || !password){
            return res.json({ success : false, message : "Missing Details"})
        }

        // vaildating email format
        if(!vaildator.isEmail(email)){
            return res.json({ success : false , message : "enter a invaild email"})
        }

        //Strong password
        if(password.length < 8 ){
            return res.json({ success : false , message : "enter a strong password"})
        }

        //hashing user password
        const hashPassword = await bcrypt.hash(password, 10)

        const userData = {
            name,
            email,
            password : hashPassword
        }

        const newUser = new User(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id : user._id}, process.env.JWT_SECRET)

        res.json({ success : true, token})

    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})
    }
}

// API for user login
export const userLogin = async (req,res) => {
    try {

        console.log(req.body); // Debugging: Log the request body

        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: 'Missing email or password' });
        }

        const user = await User.findOne({email})

        if(!user){
            return res.json({ success : false, message : 'User does not exist'})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(isMatch){
            const token = jwt.sign({ id : user._id }, process.env.JWT_SECRET)
            res.json({ success: true,token})
        } else {
            res.json({success : false, message : "InVaild crediential"})
        }
        
    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})
    }
}

//Api for get user profile data
export const getProfile = async (req,res) => {
    try {
        const { userId } = req
        const userData = await User.findById(userId).select("-password")

        res.json({ success : true, userData})

    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})
    }
}

// API to update user Profile
export const updateProfile = async (req,res) => {
    try {
        const { userId } = req // get userId from authUser middleware
        const { name, phone, address, dob, gender} = req.body;
        const imageFile = req.file;

        if(!name || !phone || !dob || !gender){
            return res.json({ success : false, message : "Data Missing"})
        }

        await User.findByIdAndUpdate(userId, {name, phone, address:JSON.parse(address),dob,gender})

        if(imageFile){

            // upload image in cloudinary
            const imageUpload =  await cloudinary.uploader.upload(imageFile.path,{resource_type: 'image'})
            const imageURL = imageUpload.secure_url

            await User.findByIdAndUpdate(userId,{image:imageURL})
        }
        
        res.json({ success : true, message : "Profile updated" })
        
    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})
    }
}

// API to book appointment
export const bookAppointment = async (req,res) => {
    try {
        const {  userId } = req;
        const { docId, slotDate, slotTime } = req.body;

        const docData = await Doctor.findById(docId).select('-password')

        if(!docData.available){
            return res.json({ success : false, message : 'Doctor not available'})
        }

        let slots_booked = docData.slots_booked || {};

        // checking for slot availability
        if (slots_booked[slotDate]) {
            if(slots_booked[slotDate].includes(slotTime)){
                return res.json({ success : false, message : 'Slot not available'})
            } else {
                slots_booked[slotDate].push(slotTime)
            } 
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }
        
        const userData = await User.findById(userId).select('-password')

        delete docData.slots_booked // It's using delete keyword slots_booked data to store the Docdata History

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount : docData.fees,
            slotTime,
            slotDate,
            date : Date.now()
        }

        const newAppointment = new Appointment(appointmentData)
        await newAppointment.save()

        // save new slots data in docData

        await Doctor.findByIdAndUpdate(docId, {slots_booked})

        res.json({ success : true, message : "Appointment Booked"})

    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})
    }
}

// APi for get all appointment fro frontend my-appiontment page
export const listAppointment = async (req,res) => {
    try {
        const { userId } = req;
        const appointments = await Appointment.find({userId})
        
        res.json({ success : true, appointments})
    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})  
    }
}

// API to cancel appointment 

export const cancelAppointment = async (req,res) => {
    try {
        
        const { userId, appointmentId  } = req.body;

        const appointmentData = await Appointment.findById(appointmentId); // Identify in appointment Id

        // verify appointment user
        if(appointmentData.user !== userId){
            return res.json({ success : false, message : 'Unauthorized action'})
        }
        
        await Appointment.findByIdAndUpdate(appointmentId, {cancelled : true}) //  It's already database (cancelled : false) and store new data (cancelled : true)

        // Releasing doctor slot

        const { docId, slotDate, slotTime } = appointmentData; // Appointment schema to extract docId and slotDate and slotTime


        const doctorData = await Doctor.findById(docId) // find to particular doctor

        let slots_booked = doctorData.slots_booked // slots_booked data already store to database 

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime) // Deletings user slots_booked in slotDate in particular time

        await Doctor.findByIdAndUpdate(docId, {slots_booked}) // after filter particular time and store to updated data

        res.json({ success : true, message : "Appointment cancelled "})

    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})  
    }
}

const razorpayInstance = new razorpay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_KEY_SECRET,
})

// API to make payment of appoinment using razorpay
export const paymentRazorpay = async (req,res) => {

    try {
        const { appointmentId } = req.body;

        const appointmentData = await Appointment.findById(appointmentId)
    
        if(!appointmentData || appointmentData.cancelled){
            return res.json({ success : false, message : "Appointment Cancelled ot not found"})
        }
    
        // creating options for razorpay payment
    
        const options = {
            amount : appointmentData.amount * 100,
            currency : process.env.CURRENCY,
            receipt : appointmentId
        }
    
        // creation of an order
        const order = await razorpayInstance.orders.create(options)
    
        res.json({ success : true, order})   
    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})  
    }
}   

// API to verify payment of razorpay
export const verifyRazorpay = async (req,res) => {
    try {
        const {razorpay_order_id} = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        console.log(orderInfo)
        if(orderInfo.status === 'paid'){
            await Appointment.findByIdAndUpdate(orderInfo.receipt, {payment :true})
            res.json({ success : true,message : "Payment Successful"})
        } else {
            res.json({ success : true,message : "Payment failed"})
        }

    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})
    }
}