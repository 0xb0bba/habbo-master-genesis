import React, { useEffect, useState } from 'react';
import './App.css';
import { FigureBuilder } from './FigureBuilder';
import { IAvatar, IMetadata } from './Metadata';
import metadata from './metadata.json'
import traitcolors from './traitcolors.json'
import figureparts from './figureparts.json'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Button, CssBaseline, Divider, Grid, IconButton, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import detectEthereumProvider from '@metamask/detect-provider';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  }
})


interface IKeyedAvatar {
  Traits: IAvatar
  ID: number
  Key: number
}

function App() {
  const [avatars, setAvatars] = useState<IKeyedAvatar[]>([])
  const [tokens, setTokens] = useState<number[]>([])
  const [showTokensCount, setShowTokensCount] = useState(16)
  const [idInput, setIdInput] = useState('')
  const [key, setKey] = useState(0)
  const handleLoadAvatar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    loadAvatar(parseInt(idInput) || 0)
  }
  const loadAvatar = (id: number) => {
    let traits = (metadata as IMetadata)[id]
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
      ID: id,
      Key: key
    }, ...avatars])
    setKey(key + 1)
  }

  const remove = (avatar: IKeyedAvatar) => {
    setAvatars(avatars.filter(a => a !== avatar))
  }

  const hasMissingHueData = (id: number) => {
    const avatar = (metadata as any)[id]
    const hue = avatar.Hues
    const huedata = (figureparts as any)['Hues'][hue]
    return !!Object.keys(huedata).find(trait => {
      const colors = huedata[trait] ? huedata[trait].split('-').length : 0
      if (avatar[trait] && (traitcolors as any)[trait][avatar[trait]] > colors) {
        return true
      }
      return false
    })
  }

  useEffect(() => {
    const fn = async () => {
      const provider = (await detectEthereumProvider()) as any
      // Already connected
      provider.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length) {
            connectWallet()
          }
        })
    }
    fn()
  }, [])

  const connectWallet = async () => {
    const provider = (await detectEthereumProvider()) as any
    const accounts = await provider.request({ method: 'eth_requestAccounts' })
    const data = await provider.request({
      method: 'eth_call',
      params: [
        {
          "from": "0x0000000000000000000000000000000000000000",
          "to": "0x8a1bbef259b00ced668a8c69e50d92619c672176", // Habbo Avatars
          "data": "0x8462151c000000000000000000000000" + accounts[0].substring(2) // Tokens of owner
        },
        "latest"
      ]
    })
    setShowTokensCount(16)
    const tokens = data.substring(130).match(/.{64}/g).map((t: string) => parseInt('0x' + t))
    setTokens(tokens.sort((t1: number, t2: number) => {
      const h1 = hasMissingHueData(t1)
      const h2 = hasMissingHueData(t2)
      if (h1 !== h2) {
        return h1 ? -1 : 1
      }
      return t1 - t2
    }))
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box p={2} className="App">
        <Stack spacing={2} divider={<Divider flexItem />}>
          <form onSubmit={handleLoadAvatar}>
            <Grid container>
              <Grid item container xs={6}>
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
                    type="submit"
                    size="small"
                    variant="contained"
                  >
                    LOAD
                  </Button>
                </Grid>
              </Grid>
              {!tokens.length && (
                <Grid item container justifyContent="flex-end" xs={6}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={connectWallet}
                  >
                    CONNECT WALLET
                  </Button>
                </Grid>
              )}
            </Grid>
          </form>
          {avatars.map(avatar => (
            <Box key={avatar.Key}>
              <Typography display="inline-block" variant='h6' mb={1}>Avatar #{avatar.ID}</Typography>
              <IconButton onClick={() => remove(avatar)}><DeleteIcon /></IconButton>
              <FigureBuilder baseTraits={avatar.Traits} ownedTokens={tokens} />
            </Box>
          ))}
          {!!tokens.length &&
            <>
              <Typography variant="h6">Your avatars</Typography>
              <Box>
                {tokens.slice(0, showTokensCount).map(token => (
                  <Box title={`#${token}`} display="inline" position="relative" key={token} m={1}>
                    <img style={{ cursor: 'pointer' }} onClick={() => loadAvatar(token)} alt={`#${token}`} src={`https://nft-tokens.habbo.com/avatars/images/${token}.png`} />
                    {hasMissingHueData(token) && <ErrorOutlineOutlinedIcon fontSize='large' style={{ color: 'red', position: 'absolute', right: 0 }} />}
                  </Box>
                ))}
              </Box>
              <Box>
                {tokens.length > showTokensCount && <Button variant="text" onClick={() => setShowTokensCount(showTokensCount + 16)}>SHOW MORE</Button>}
              </Box>
            </>
          }
        </Stack>
      </Box>
    </ThemeProvider >
  );
}

export default App;
