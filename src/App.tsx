import React, { useState } from 'react';
import './App.css';
import { FigureBuilder } from './FigureBuilder';
import { IAvatar, IMetadata } from './Metadata';
import metadata from './metadata.json'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Button, CssBaseline, Divider, Grid, IconButton, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  }
})


interface IKeyedAvatar {
  Traits: IAvatar
  ID: string
  Key: number
}

function App() {
  const [avatars, setAvatars] = useState<IKeyedAvatar[]>([])
  const [idInput, setIdInput] = useState('')
  const [key, setKey] = useState(0)
  const loadAvatar = () => {
    let traits = (metadata as IMetadata)[parseInt(idInput)]
    if (!traits) {
      traits = {
        Gender: 'Male',
        Complexion: 'Vanilla',
        Hues: 'Mysterious',
        Face: 'Default',
        Shirt: 'Classic T-Shirt',
        Effect: 'Basic H'
      }
    }
    // Add legs none to avatars that don't have legs, as this needs to be rendered
    if (!traits.Legs) {
      traits.Legs = 'None'
    }
    setAvatars([{
      Traits: { ...traits },
      ID: idInput,
      Key: key
    }, ...avatars])
    setKey(key + 1)
  }

  const remove = (avatar: IKeyedAvatar) => {
    setAvatars(avatars.filter(a => a !== avatar))
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box p={2} className="App">
        <Stack spacing={2} divider={<Divider flexItem />}>
          <Grid container>
            <Grid item alignItems="stretch" style={{ display: "flex" }}>
              <TextField
                placeholder="Enter NFT ID"
                size="small"
                value={idInput}
                onChange={e => setIdInput(e.target.value)}
              />
            </Grid>
            <Grid item alignItems="stretch" style={{ display: "flex" }}>
              <Button
                size="small"
                variant="contained"
                onClick={loadAvatar}>LOAD
              </Button>
            </Grid>
          </Grid>
          {avatars.map(avatar => (
            <Box key={avatar.Key}>
              <Typography display="inline-block" variant='h6' mb={1}>Avatar #{avatar.ID}</Typography>
              <IconButton onClick={() => remove(avatar)}><DeleteIcon /></IconButton>
              <FigureBuilder baseTraits={avatar.Traits} />
            </Box>
          ))}
        </Stack>
      </Box>
    </ThemeProvider >
  );
}

export default App;
