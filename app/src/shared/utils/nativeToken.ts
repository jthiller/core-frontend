const getNativeTokenName = (chainId: number): string => {
    switch (`${chainId}`) {
        case '137':
        case '8997':
            return 'MATIC'

        case '100':
            return 'xDai'

        default:
            return 'Ether'
    }
}

export default getNativeTokenName
