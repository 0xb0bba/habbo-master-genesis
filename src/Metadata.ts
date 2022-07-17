export type IMetadata = IAvatar[]

export interface IAvatar {
    Belt?: string
    Complexion: string
    Effect: string
    Eyewear?: string
    Face: string
    Gender: string
    Hair?: string
    'Hair Color'?: string
    Hat?: string
    'Head Accessory'?: string
    Hues: string
    Jacket?: string
    Jewelry?: string
    Legs?: string
    Mask?: string
    Shirt?: string
    Shoes?: string
}

export type Trait = keyof IAvatar

export interface ITrait {
    trait_type: Trait
    value: string
}


export const rankEffect = (effect: string) => {
    switch (effect) {
        case 'Basic H':
            return 0
        case 'Golden H':
            return 1
        case 'Diamond H':
            return 2
        case 'Rainbow H':
            return 3
        case 'Trippy H':
            return 4
        case 'Ultra Trippy H':
            return 5
    }
    return 0
}