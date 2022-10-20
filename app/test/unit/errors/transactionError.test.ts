import TransactionError from '$shared/errors/TransactionError'
describe('TransactionFailedError', () => {
    it('must extend Error', () => {
        // This is tested because of a bug in babel
        expect(new TransactionError('moi', {transactionHash: 'receipt'}) instanceof Error).toBe(true)
    })
    it('must be instanceof itself', () => {
        // This is tested because of a bug in babel
        expect(new TransactionError('moi', {transactionHash: 'receipt'}) instanceof TransactionError).toBe(true)
    })
    it('must give the receipt on getReceipt', () => {
        expect(new TransactionError('moi', {transactionHash: 'receipt'}).getReceipt()).toEqual({transactionHash: 'receipt'})
    })
})
