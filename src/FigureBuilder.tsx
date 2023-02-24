import { useEffect, useMemo, useState } from 'react';
import figurepartsTyped from './figureparts.json'
import metadata from './metadata.json'
import traitcolors from './traitcolors.json'
import { Figure } from './Figure';
import { IAvatar, IMetadata, rankEffect, Trait } from './Metadata'
import { Autocomplete, Box, Button, Chip, FormControl, Grid, InputLabel, ListItemIcon, ListItemText, MenuItem, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'

const figureparts = figurepartsTyped as any

const format = function (format: string, ...args: any[]) {
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match
    })
}

type FigurePart = string | { m: string, f: string }

const autocompleteOptions = Object.keys(figureparts).flatMap(trait => {
    return Object.keys(figureparts[trait]).map(value => ({
        trait: trait as Trait,
        value
    }))
})

type TraitList = {
    [key in keyof IAvatar]-?: string[]
}

const masterGenTraits: TraitList = {
    'Eyewear': ['Laser Eyes', 'Pirate Skull Patch', 'Blindfold'],
    'Face': ['Mummy Face', 'Tentacle Dude', 'Hairy Dude'],
    'Hat': ['Propeller Hat', 'Pirate Hat', 'Fedora'],
    'Head Accessory': ['Star Shades'],
    'Jacket': ['Bankruptcy Barrel', 'Pirate Jacket', 'Bomber Jacket'],
    'Jewelry': ['Headphones'],
    'Legs': ['Checkered Shorts', 'Wide Jeans', 'Wrapped Pants'],
    'Mask': ['Handlebar Mustache', 'Phantom Mask'],
    'Shirt': ['Grid Shirt', 'Wider Stripes'],
    'Shoes': ['Clown Shoes', 'Mismatched Shoes', 'HC Shoes'],
    'Complexion': [],
    'Effect': [],
    'Gender': [],
    'Hues': [],
    'Belt': [],
    'Hair': [],
    'Hair Color': []
}

const allowNone = (trait: Trait) => {
    switch (trait) {
        case 'Belt':
        case 'Eyewear':
        case 'Hair':
        case 'Hair Color':
        case 'Hat':
        case 'Head Accessory':
        case 'Jacket':
        case 'Jewelry':
        case 'Mask':
            return true
    }
    return false
}

export const FigureBuilder: React.FC<{ baseTraits: IAvatar, ownedTokens: number[] }> = ({ baseTraits, ownedTokens }) => {
    const [searchInput, setSearchInput] = useState('')
    const [traits, setTraits] = useState(baseTraits)
    const [showSuggestionsCount, setShowSuggestionsCount] = useState(16)
    useEffect(() => {
        setTraits(baseTraits)
    }, [baseTraits])

    const getTraitColor = (trait: Trait, opt: string) => {
        if (masterGenTraits[trait].includes(opt)) {
            return 'orange'
        }
        if ((baseTraits[trait] || 'None') === opt) {
            return ''
        }
        if (trait === 'Gender') {
            return ''
        }
        if (opt === 'None' && allowNone(trait)) {
            return ''
        }
        const editedWithout = { ...requireTraits } as any
        delete editedWithout[trait]

        if (Object.keys(editedWithout).length === Object.keys(requireTraits).length && burnSuggestions.length) {
            const match = burnSuggestions.find(id => (id.avatar[trait] || 'None') === opt)
            if (match) {
                return ''
            }
        } else {
            const newTraits = {
                ...editedWithout,
                [trait]: opt
            } as IAvatar

            const match = metadata
                .find(avatar => avatar && Object.keys(newTraits).every((edited) =>
                    newTraits[edited as Trait] === (avatar[edited as Trait] || 'None')
                ))
            if (match) {
                return ''
            }
        }
        return 'grey'
    }

    const hasMissingHueData = (hue: string) => {
        const huedata = (figureparts as any)['Hues'][hue]
        return !!Object.keys(huedata).find(trait => {
            const colors = huedata[trait] ? huedata[trait].split('-').length : 0
            if (traits[trait as Trait] && (traitcolors as any)[trait][traits[trait as Trait]!] > colors) {
                return true
            }
            return false
        })
    }

    const getTraitIcon = (trait: Trait, opt: string) => {
        if (opt === 'None') {
            return null
        }
        if (trait === 'Hues') {
            if (hasMissingHueData(opt)) {
                return <ListItemIcon title="Some colors are missing"><QuestionMarkIcon /></ListItemIcon>
            }
            return null
        }
        let part = figureparts[trait][opt] as FigurePart
        if (typeof part !== 'string') {
            if (!part.m && !part.f) {
                // Neither are defined
                return <ListItemIcon title="Trait info missing"><PriorityHighIcon /></ListItemIcon>
            }
            // Check if gender specific trait is defined
            const genderPart = traits.Gender === 'Male' ? part.m : part.f
            if (!genderPart) {
                return <ListItemIcon title="Trait is incompatible with selected gender"><PriorityHighIcon /></ListItemIcon>
            }
        } else if (!part) {
            return <ListItemIcon title="Trait info missing"><PriorityHighIcon /></ListItemIcon>
        }

        const err = getMissingColors(trait, opt, traits['Hues'])
        if (err) {
            return <ListItemIcon title={err}><QuestionMarkIcon /></ListItemIcon>
        }

        return null
    }

    const getMissingColors = (trait: string, opt: string, hue: string) => {
        const opts = (traitcolors as any)[trait]
        if (!opts) {
            return false
        }
        const requiredColors = opts[opt]
        if (!requiredColors) {
            return false
        }
        const colors = figureparts['Hues'][hue][trait]
        if (colors === undefined) {
            return false
        }
        const colorCount = colors ? colors.split('-').length : 0
        if (colorCount >= requiredColors) {
            return false
        }
        if (colorCount === 0 && requiredColors === 2) {
            return 'Missing primary and secondary color'
        }
        if (colorCount === 1 && requiredColors === 2) {
            return 'Missing secondary color'
        }
        if (colorCount === 0 && requiredColors === 1) {
            return 'Missing primary color'
        }
        return 'Oops' + colorCount + ' ' + requiredColors + ' ' + trait
    }

    const handleSelectTrait = (e: SelectChangeEvent<string>) => selectTrait(e.target.name as Trait, e.target.value)
    const restoreTrait = (name: Trait) => selectTrait(name, baseTraits[name] || 'None')

    const selectTrait = (name: Trait, value: string) => {
        setTraits({
            ...traits,
            [name]: value
        } as IAvatar)
    }

    const editedTraits = useMemo(() => {
        return Object.keys(traits)
            .filter(trait => traits[trait as Trait] !== (baseTraits[trait as Trait] || 'None'))
            .reduce((a, trait) => ({ ...a, [trait]: traits[trait as Trait] }), {}) as IAvatar
    }, [baseTraits, traits])

    const requireTraits = useMemo(() => {
        return Object.keys(editedTraits)
            .filter(trait => !(trait === 'Gender' ||
                (editedTraits[trait as Trait] === 'None' && allowNone(trait as Trait)) ||
                masterGenTraits[trait as Trait].includes(editedTraits[trait as Trait]!)))
            .reduce((a, trait) => ({ ...a, [trait]: editedTraits[trait as Trait] }), {}) as IAvatar
    }, [editedTraits])

    const burnSuggestions = useMemo(() => {
        if (!Object.keys(requireTraits).length) {
            return []
        }

        const metadataTyped = metadata as IMetadata
        const matches = metadata.map((avatar, id) => ({ avatar, id }))
            .filter(val => val.avatar && Object.keys(requireTraits).every(edited =>
                requireTraits[edited as Trait] === (val.avatar[edited as Trait] || 'None'))
            )
        return matches.sort((m1, m2) => {
            const owned1 = ownedTokens.includes(m1.id)
            const owned2 = ownedTokens.includes(m2.id)
            if (owned1 !== owned2) {
                return owned1 ? -1 : 1
            }

            const e1 = rankEffect(metadataTyped[m1.id]['Effect'])
            const e2 = rankEffect(metadataTyped[m2.id]['Effect'])
            if (e1 !== e2) {
                return e1 - e2
            }
            return m1.id - m2.id
        })
    }, [requireTraits, ownedTokens])

    useEffect(() => {
        setShowSuggestionsCount(16)
    }, [burnSuggestions])

    const figureString = useMemo(() => {
        const hue = traits['Hues']
        const complexion = traits['Complexion']
        const gender = traits['Gender']
        const hairColor = traits['Hair Color']
        return Object.keys(traits).map(trait => {
            let parts = figureparts[trait]
            if (!parts) {
                // Effect
                return ''
            }
            let part = parts[traits[trait as Trait] as any] as FigurePart
            if (typeof part !== 'string') {
                // Prefer own gender if known, otherwise try the other gender. It may be correct
                part = gender === 'Male' ? part.m || part.f : part.f || part.m
            }
            switch (trait) {
                case 'Belt':
                case 'Eyewear':
                case 'Hat':
                case 'Head Accessory':
                case 'Jacket':
                case 'Jewelry':
                case 'Legs':
                case 'Mask':
                case 'Shirt':
                case 'Shoes':
                    // Color from hue, specific for the trait type. Hopefully we don't need a color for each specific trait option
                    // Some traits have 1 color, others have multiple. But passing in multiple seems to work OK
                    return format(part, figureparts["Hues"][hue][trait])
                case 'Face':
                    // Color from complexion
                    return format(part, figureparts["Complexion"][complexion])
                case 'Hair':
                    // Color from hair color
                    return format(part, figureparts["Hair Color"][hairColor || 'None'])
            }
            return ''
        }).filter(part => part).join('.')
    }, [traits])

    return (
        <Grid container>
            <Grid item xs={8} md={9} xl={10}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Autocomplete
                            disablePortal
                            options={autocompleteOptions}
                            groupBy={opt => opt.trait}
                            getOptionLabel={opt => `${opt.trait} ${opt.value}`}
                            renderOption={(props, opt) => <MenuItem {...props}>
                                <div
                                    style={{
                                        display: 'flex',
                                        color: getTraitColor(opt.trait, opt.value)
                                    }}>
                                    <ListItemText>{opt.value}</ListItemText>
                                    {getTraitIcon(opt.trait, opt.value)}
                                </div>
                            </MenuItem>}
                            renderInput={(params) => <TextField {...params} label="Search trait" />}
                            autoHighlight
                            value={null}
                            inputValue={searchInput}
                            onInputChange={(_, value) => {
                                setSearchInput(value)
                            }}
                            onChange={(_, opt) => {
                                setSearchInput('')
                                if (opt) {
                                    selectTrait(opt.trait, opt.value)
                                }
                            }}
                        />
                    </Grid>
                    {Object.keys(figureparts).map(trait => (
                        <Grid key={trait} item xs={6} md={4} xl={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>{trait}</InputLabel>
                                <Select
                                    MenuProps={{ disableScrollLock: true }}
                                    name={trait}
                                    label={trait}
                                    value={traits[trait as Trait] || 'None'}
                                    onChange={handleSelectTrait}
                                >
                                    {Object.keys(figureparts[trait]).map(opt => (
                                        <MenuItem key={opt} value={opt}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: getTraitColor(trait as Trait, opt)
                                            }}>
                                                <ListItemText>{opt}</ListItemText>
                                                {getTraitIcon(trait as Trait, opt)}
                                            </div>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
            <Grid item container xs={4} md={3} xl={2} direction="column">
                <Figure figure={figureString} />
                <Grid item>
                    <Box m={1}>
                        {Object.keys(editedTraits).map(trait => (
                            <Chip style={{ color: getTraitColor(trait as Trait, editedTraits[trait as Trait]!) }} key={trait} label={`${trait}: ${editedTraits[trait as Trait]}`} onDelete={() => restoreTrait(trait as Trait)} />
                        ))}
                    </Box>
                </Grid>
                <Grid item>
                    {Object.keys(traits).map(trait => {
                        const msg = getMissingColors(trait, traits[trait as Trait]!, traits['Hues'])
                        if (!msg) {
                            return null
                        }
                        return <Typography m={1} variant='subtitle2' key={trait}>{traits[trait as Trait]}: {msg}</Typography>
                    })}
                </Grid>
            </Grid>

            {!!Object.keys(requireTraits).length && (
                <>
                    <Grid item xs={12} md={12}>
                        <Box m={1}>
                            {!!burnSuggestions.length && <Typography variant="h6" mb={1}>{burnSuggestions.length} Suggestions</Typography>}
                            {!burnSuggestions.length && <Typography variant="h6" mb={1}>Sorry, no avatar matches selected criteria.</Typography>}
                            {burnSuggestions.slice(0, showSuggestionsCount).map(burn => (
                                <Box title={`#${burn.id}`} display="inline" position="relative" key={burn.id} m={1} >
                                    <a href={`https://opensea.io/assets/ethereum/0x8a1bbef259b00ced668a8c69e50d92619c672176/${burn.id}`} target="_blank" rel="noreferrer">
                                        <img alt={`#${burn.id}`} src={`https://nft-tokens.habbo.com/avatars/images/${burn.id}.png`} />
                                        {ownedTokens.includes(burn.id) && <CheckCircleOutlinedIcon fontSize='large' style={{ color: 'green', position: 'absolute', right: 0 }} />}
                                    </a>
                                </Box>
                            ))}
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        {burnSuggestions.length > showSuggestionsCount && <Button variant="text" onClick={() => setShowSuggestionsCount(showSuggestionsCount + 16)}>SHOW MORE</Button>}
                    </Grid>
                </>
            )}
        </Grid>
    )
}