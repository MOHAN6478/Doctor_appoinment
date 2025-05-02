import validator from 'validator';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import Doctor from '../models/doctor.js';
import jwt from "jsonwebtoken";
import Appointment from '../models/appointment.js';
import User from '../models/user.js';

//Api for adding doctor : api/admin/add-doctor
export const addDoctor = async (req,res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file;

        if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address){
            return res.json({ success : false, message : "Missing Details"})
        }

        //validate email format
        if(!validator.isEmail(email)){
            return res.json({ success : false, message : " Please enter a valid email"})
        }

        //validating strong password
        if(password.length < 8){
            return res.json({ success : false, message : 'Please enter a Strong password'})
        }

        //hashing doctor password
        const hashPassword = await bcrypt.hash(password, 10)

        //upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type : "image"})
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            password : hashPassword,
            image : imageUrl,
            speciality,
            degree,
            experience,
            about,
            fees,
            address : JSON.parse(address),
            date : Date.now()
        }

        const newDoctor = new Doctor(doctorData)
        await newDoctor.save()

        res.json({ success : true, message : "Doctor Added" })

    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message })
    }
}


//API for admin Login

export const loginAdmin = async (req,res) => {
    try {
        
        const {email, password} = req.body;

        if(email === process.env.ADMIN_EMAIL &&  password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign( email + password, process.env.JWT_SECRET)
            res.json({ success : true, token})
        } else {
            res.json({ success : false, message : "Invalid credentials"})
        }

    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message })  
    }
}

// API to get all doctors list for admin panel

export const allDoctors = async (req,res) =>{
    try {
        const doctors = await Doctor.find({}).select('-password') // => all doctors in set to in this object
        res.json({ success : true, doctors})
    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message }) 
    }
}

// API to get all appointments list
export const appointmentsAdmin = async (req,res) => {
    try {
        const appointments = await Appointment.find({}) // In this object provides all the my-appointments list 
        res.json({ success : true, appointments})
    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message }) 
    }
}

// API for appointment cancelletion
export const appointmentCancel = async (req,res) => {
    try {
        
        const { appointmentId  } = req.body;

        const appointmentData = await Appointment.findById(appointmentId); // Identify in appointment Id

        
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

// API to get dashboard data for admin panel
export const adminDashboard = async (req,res) => {
    try {
        const doctors = await Doctor.find({})
        const users = await User.find({})
        const appointments = await Appointment.find({})

        const dashData = {
            doctors : doctors.length,
            appointments : appointments.length,
            patients : users.length,
            latestAppointments : appointments.reverse().slice(0,5)
        }

        res.json({ success : true, dashData})
        
    } catch (error) {
        console.log(error)
        res.json({ success : false, message : error.message})  
    }
}
