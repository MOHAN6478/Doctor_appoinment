import { createContext } from "react";

export const AppContext = createContext();

const AppContextProvider = ({children}) => {

    const currency = '$'

    const calculateAge = (dob) => {
        const today = new Date()
        const birthDate = new Date(dob)

        let age = today.getFullYear() - birthDate.getFullYear()
        return age
    }

    const months = [" ","Jan", "Feb", "Mar", "Apr", "May", "Jan", "Jul", "Aug", "Sep", "Oct", "Nav", "Dec"];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0]+ " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }

    const value={
        calculateAge, slotDateFormat, currency
    }

    return(
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export default AppContextProvider;