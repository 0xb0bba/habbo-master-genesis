import { FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import React, { useContext, useState } from "react"

export const NitroImager = 'https://imager.habboon.pw/?size=l&figure='
export const HabboImager = 'https://www.habbo.com/habbo-imaging/avatarimage?size=l&figure='

export const ImagerContext = React.createContext({
    value: NitroImager,
    setValue: (val: string) => { }
})

export const ImagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [value, setValue] = useState(NitroImager)
    return <ImagerContext.Provider value={{ value, setValue }}>
        {children}
    </ImagerContext.Provider>
}

export const ImagerSelect = () => {
    const { value, setValue } = useContext(ImagerContext)
    return (
        <FormControl size="small">
            <InputLabel>Imager</InputLabel>
            <Select size='small' name='Imager' label='Imager' value={value} onChange={e => setValue(e.target.value)}>
                <MenuItem value={NitroImager}>Nitro</MenuItem>
                <MenuItem value={HabboImager}>Habbo</MenuItem>
            </Select>
        </FormControl>)
}