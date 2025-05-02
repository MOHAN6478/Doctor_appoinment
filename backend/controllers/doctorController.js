import Doctor from '../models/doctor.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Appointment from '../models/appointment.js';

export const changeAvailablity = async(req,res) => {
    try {
        const {docId} = req.body;

        const docData = await Doctor.findById(docId)
        await Doctor.findByIdAndUpdate(docId, {available : !docData.available})
        res.json({success : true, message : 'Availability Changed'})
    } catch (error) {
        console.log(error.message)
        res.json({ success : false, message : error.message})
    }
}

export const doctorList = async (req,res) => {
    try {
        const doctors = await Doctor.find({}).select(['-password', '-email'])

        res.json({ success : true, doctors})
    } catch (error) {
        console.log(error.message)
        res.json({ success : false, message : error.message})
    }
}

// API for doctor login
export const loginDoctor = async (req,res) => {
    try {
        
        const { email, password } = req.body;
        const doctor = await Doctor.findOne({email})

        if(!doctor){
            return res.json({ success : false, message : 'Invaild credentials'})
        }

        const isMatch = await bcrypt.compare(password, doctor.password)

        if(isMatch){
            
            const token = jwt.sign({id:doctor._id}, process.env.JWT_SECRET)

            res.json({ success : true , token})
        } else {
            res.json({ success : false, message : 'Invaild credentials'})
        }

    } catch (error) {
        console.log(error.message)
        res.json({ success : false, message : error.message}) 
    }
}

// API to get doctor appointments for doctor panel
export const appointmentsDoctor = async (req,res) => {
    try {
        const { docId } = req ;
        const appointments = await Appointment.find({ docId })
        
        res.json({ success : true,appointments})

    } catch (error) {
        console.log(error.message)
        res.json({ success : false, message : error.message})
    }
}

// API to mark appointment completed for doctor panel
export const appointmentComplete = async (req,res) => {
    try {
        const { docId } = req;
        const { appointmentId } = req.body;

        const appointmentData =await Appointment.findById(appointmentId) 

        if(appointmentData && appointmentData.docId === docId){

            await Appointment.findByIdAndUpdate(appointmentId, {isCompleted : true})
            return res.json({ success : true, message : "Appointment Completed"})

        } else {
            return res.json({ success : false, message : "Mark Failed"})
        }

    } catch (error) {
        console.log(error.message)
        res.json({ success : false, message : error.message})  
    }
}

// API to cancel appointment completed for doctor panel
export const appointmentCancel = async (req,res) => {
    try {
        const { docId } = req ;
        const { appointmentId } = req.body;

        const appointmentData = await Appointment.findById(appointmentId) 

        if(appointmentData && appointmentData.docId === docId){

            await Appointment.findByIdAndUpdate(appointmentId, { cancelled : true })
            return res.json({ success : true, message : "Appointment Cancelled"})

        } else {
            return res.json({ success : false, message : "Cancelled Failed"})
        }

    } catch (error) {
        console.log(error.message)
        res.json({ success : false, message : error.message})  
    }
}

// API to get dashboard data for doctor panel
export const doctorDashboard = async (req,res) => {
    try {
        const {docId} = req;
        
        const appointments = await Appointment.find({docId})

        let earnings = 0;

        appointments.map((item) => {
            if(item.isCompleted || item.payment){
                earnings += item.amount
            }
        })

        let patients = [];

        appointments.map((item) => {
            if(patients.includes(item.userId)){
                patients.push(item.userId)
            }
        })

        const dashData = {
            earnings,
            appointments : appointments.length,
            patients : patients.length,
            latestAppointments : appointments.reverse().slice(0,5)
        }

        res.json({ success : true, dashData})

    } catch (error) {
        console.log(error.message)
        res.json({ success : false, message : error.message})
    }
}

// API to get doctor profile fro doctor panel
export const doctorProfile = async (req,res) => {
    try {
        const {docId} = req;
        const profileData = await Doctor.findById(docId).select('-password')

        res.json({ success : true, profileData})
    } catch (error) {
        console.log(error.message)
        res.json({ success : false, message : error.message})
    }
}

// API to update doctor profile data from Doctor panel
export const updateDoctorProfile = async (req,res) => {
    try {
        const {docId} = req;
        const { fees, address, available } = req.body;

        await Doctor.findByIdAndUpdate(docId,{ fees, address, available })

        res.json({ success : true, message : "Profile Updated"})

    } catch (error) {
        console.log(error.message)
        res.json({ success : false, message : error.message})
    }
}