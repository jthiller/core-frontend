import { $Values } from 'utility-types'
import EventEmitter from 'events'
import getWeb3 from '$utils/web3/getWeb3'
import getPublicWeb3 from '$utils/web3/getPublicWeb3'
import { areAddressesEqual } from '$mp/utils/smartContract'
import type { NumberString } from '$shared/types/common-types'
import { hasTransactionCompleted, getTransactionReceipt } from '$shared/utils/web3'
import { getTransactionsFromSessionStorage } from '$shared/utils/transactions'
import TransactionError from '$shared/errors/TransactionError'
import getChainId from '$utils/web3/getChainId'
import getProviderChainId from '$utils/web3/getProviderChainId'
import getDefaultWeb3Account from '$utils/web3/getDefaultWeb3Account'
export const events = {
    ACCOUNT: 'WEB3POLLER/ACCOUNT',
    ACCOUNT_ERROR: 'WEB3POLLER/ACCOUNT_ERROR',
    NETWORK: 'WEB3POLLER/NETWORK',
    NETWORK_ERROR: 'WEB3POLLER/NETWORK_ERROR',
    TRANSACTION_COMPLETE: 'WEB3POLLER/TRANSACTION_COMPLETE',
    TRANSACTION_ERROR: 'WEB3POLLER/TRANSACTION_ERROR',
}
export type Event = $Values<typeof events>
export type Handler = (arg0: any, arg1: any) => void | Promise<void>
const WEB3_POLL_INTERVAL = 1000 // 1s

const NETWORK_POLL_INTERVAL = 1000 // 1s

const PENDING_TX_POLL_INTERVAL = 1000 * 5 // 5s

let lastWarning = ''

function warnOnce(error: Error) {
    // do not print warning if same as last warning
    if (error.message) {
        if (lastWarning === error.message) {
            return
        }

        lastWarning = error.message
    }

    console.warn(error)
}

class CancelError extends Error {
    __proto__: any

    constructor() {
        super('Cancelled')
        this.__proto__ = CancelError.prototype // eslint-disable-line no-proto
    }
}

// eslint-disable-next-line prefer-const
let instance: Web3Poller
const allowedCaller = {}

class Web3Poller {
    web3PollTimeout:  ReturnType<typeof setTimeout> | null | undefined = null
    ethereumNetworkPollTimeout:  ReturnType<typeof setTimeout> | null | undefined = null
    pendingTransactionsPollTimeout:  ReturnType<typeof setTimeout> | null | undefined = null
    account: any = null
    networkId: NumberString | null | undefined = ''
    emitter: EventEmitter = new EventEmitter()

    static subscribe(event: Event, handler: Handler): void {
        instance.subscribe(event, handler)
    }

    static unsubscribe(event: Event, handler: Handler): void {
        instance.unsubscribe(event, handler)
    }

    constructor(caller: any) {
        if (allowedCaller !== caller) {
            throw new Error('Use `subscribe` or `unsubscribe` to interract with Web3Poller.')
        }

        // Start polling for info
        this.pollWeb3()
        this.pollEthereumNetwork()
        this.pollPendingTransactions()
    }

    subscribe(event: Event, handler: Handler): void {
        this.emitter.on(event, handler)
    }

    unsubscribe(event: Event, handler: Handler): void {
        this.emitter.removeListener(event, handler)
    }

    startWeb3Poll = (): void => {
        this.clearWeb3Poll()
        this.web3PollTimeout = setTimeout(this.pollWeb3, WEB3_POLL_INTERVAL)
    }
    pollWeb3 = (): Promise<void> =>
        this.fetchWeb3Account().then(this.startWeb3Poll, (error) => {
            warnOnce(error)
            this.startWeb3Poll()
        })
    startEthereumNetworkPoll = (): void => {
        this.clearEthereumNetworkPoll()
        this.ethereumNetworkPollTimeout = setTimeout(this.pollEthereumNetwork, NETWORK_POLL_INTERVAL)
    }
    pollEthereumNetwork = (): Promise<void> =>
        this.fetchChosenEthereumNetwork().then(this.startEthereumNetworkPoll, (error) => {
            warnOnce(error)
            this.startEthereumNetworkPoll()
        })
    clearWeb3Poll = (): void => {
        if (this.web3PollTimeout) {
            clearTimeout(this.web3PollTimeout)
            this.web3PollTimeout = null
        }
    }
    clearEthereumNetworkPoll = (): void => {
        if (this.ethereumNetworkPollTimeout) {
            clearTimeout(this.ethereumNetworkPollTimeout)
            this.ethereumNetworkPollTimeout = null
        }
    }
    clearPendingTransactionsPoll = (): void => {
        if (this.pendingTransactionsPollTimeout) {
            clearTimeout(this.pendingTransactionsPollTimeout)
            this.pendingTransactionsPollTimeout = null
        }
    }
    fetchWeb3Account = (): Promise<void> =>
        getDefaultWeb3Account().then(
            (account) => {
                this.handleAccount(account)
                // needed to avoid warnings about creating promise inside a handler
                // if any other web3 actions are dispatched.
                // eslint-disable-next-line promise/no-return-wrap
                return Promise.resolve()
            },
            (err) => {
                if (this.account) {
                    this.account = null
                    this.emitter.emit(events.ACCOUNT_ERROR, err)
                }
            },
        )
    handleAccount = (account: string): void => {
        const next = account
        const didChange = !!(this.account && next && !areAddressesEqual(this.account, next))
        const didDefine = !!(!this.account && next)

        // Check current provider so that account event is not sent prematurely
        // (ie. wait for user to approve access to Metamask)
        if (getWeb3().currentProvider !== null && (didDefine || didChange)) {
            this.account = next
            this.emitter.emit(events.ACCOUNT, next)
        }
    }
    fetchChosenEthereumNetwork = (): Promise<void> => {
        const fetchPromise = getChainId()
        // make sure getting the network does not hang longer than the poll timeout
        const cancelPromise = new Promise((resolve, reject) => {
            setTimeout(() => reject(new CancelError()), NETWORK_POLL_INTERVAL)
        })
        return Promise.race([fetchPromise, cancelPromise]).then(
            (network) => {
                this.handleNetwork(network.toString() || '')
            },
            (err) => {
                if (!(err instanceof CancelError) && this.networkId) {
                    this.networkId = null
                    this.emitter.emit(events.NETWORK_ERROR, err)
                }
            },
        )
    }
    handleNetwork = (network: NumberString): void => {
        const next = network
        const didChange = this.networkId && next && this.networkId !== next
        const didDefine = !this.networkId && next

        if (didDefine || didChange) {
            this.networkId = next
            this.emitter.emit(events.NETWORK, next)
        }
    }
    startPendingTransactionsPoll = (): void => {
        this.clearPendingTransactionsPoll()
        this.pendingTransactionsPollTimeout = setTimeout(this.pollPendingTransactions, PENDING_TX_POLL_INTERVAL)
    }
    pollPendingTransactions = (): Promise<void> =>
        this.handlePendingTransactions().then(this.startPendingTransactionsPoll, (error) => {
            warnOnce(error)
            this.startPendingTransactionsPoll()
        })
    handlePendingTransactions = (): Promise<void[]> => {
        const web3 = getPublicWeb3()
        return Promise.all(
            Object.keys(getTransactionsFromSessionStorage()).map(async (txHash) => {
                let completed
                let receipt

                try {
                    const chainId = getProviderChainId()
                    completed = await hasTransactionCompleted(txHash, chainId)
                    receipt = !!completed && (await getTransactionReceipt(txHash, chainId))
                } catch (err) {
                    warnOnce(err)
                    return // bail out
                }

                // Sometimes the receipt will be empty even if the call succeeds.
                // If so, the next interval should receive it.
                if (completed && receipt) {
                    if (receipt.status === true) {
                        this.emitter.emit(events.TRANSACTION_COMPLETE, txHash, receipt)
                    } else {
                        this.emitter.emit(
                            events.TRANSACTION_ERROR,
                            txHash,
                            new TransactionError('Transaction failed', receipt),
                        )
                    }
                }
            }),
        )
    }
}

instance = new Web3Poller(allowedCaller)
export default Web3Poller
