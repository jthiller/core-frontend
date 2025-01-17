import React, { useState, useCallback, useEffect, useRef } from 'react'
import useModal from '$shared/hooks/useModal'
import type { Product } from '$mp/types/product-types'
import '$mp/types/product-types'
import GuidedDeployDataUnionDialog from '$mp/components/Modal/GuidedDeployDataUnionDialog'
import ConfirmDeployDataUnionDialog from '$mp/components/Modal/ConfirmDeployDataUnionDialog'
import DeployingDataUnionDialog from '$mp/components/Modal/DeployingDataUnionDialog'
import WrongNetworkSelectedDialog from '$shared/components/WrongNetworkSelectedDialog'
import ErrorDialog from '$mp/components/Modal/ErrorDialog'
import { isLocalStorageAvailable } from '$shared/utils/storage'
import { deployDataUnion } from '$mp/modules/dataUnion/services'
import { isEthereumAddress } from '$mp/utils/validate'
import type { Address } from '$shared/types/web3-types'
import { averageBlockTime } from '$shared/utils/web3'
import useIsMounted from '$shared/hooks/useIsMounted'
import useWeb3Status from '$shared/hooks/useWeb3Status'
import Web3ErrorDialog from '$shared/components/Web3ErrorDialog'
import Activity, { actionTypes, resourceTypes } from '$shared/utils/Activity'
import WrongNetworkSelectedError from '$shared/errors/WrongNetworkSelectedError'
import useSwitchChain from '$shared/hooks/useSwitchChain'
import { getChainIdFromApiString } from '$shared/utils/chains'

type DeployDialogProps = {
    product: Product
    api: Record<string, any>
    updateAddress: (arg0: Address | null | undefined) => void
}

const steps = {
    GUIDE: 'guide',
    CONFIRM: 'deploy',
    COMPLETE: 'wait',
}
const SKIP_GUIDE_KEY = 'marketplace.skipDeployGuide'
const storage = isLocalStorageAvailable() ? window.localStorage : null

function skipGuide(): boolean {
    return !!(storage && JSON.parse(storage.getItem(SKIP_GUIDE_KEY) || 'false'))
}

function setSkipGuide(value) {
    if (!storage) {
        return
    }

    storage.setItem(SKIP_GUIDE_KEY, JSON.stringify(value))
}

// allow 5s for the API to start in data union server
const API_READY_ESTIMATE = 5

export const DeployDialog = ({ product, api, updateAddress }: DeployDialogProps) => {
    const dontShowAgain = skipGuide()
    const [step, setStep] = useState(dontShowAgain ? steps.CONFIRM : steps.GUIDE)
    const [deployError, setDeployError] = useState(null)
    const [estimate, setEstimate] = useState(0)
    const [address, setAddress] = useState(undefined)
    const isMounted = useIsMounted()
    const { web3Error, checkingWeb3 } = useWeb3Status({
        requireWeb3: true,
        requireNetwork: getChainIdFromApiString(product.chain),
    })
    const onClose = useCallback(() => {
        api.close(!!address && isEthereumAddress(address))
    }, [api, address])
    const onCloseRef = useRef()
    onCloseRef.current = onClose
    const productId = product.id
    const chainId = product && getChainIdFromApiString(product.chain)
    const { adminFee = '0' } = product || {}
    const onDeploy = useCallback(async () => {
        // Set estimate
        let blockEstimate = 0

        try {
            blockEstimate = await averageBlockTime()
        } catch (e) {
            // just log the error if estimate fails, otherwise we can continue
            console.warn(e)
        }

        if (!isMounted()) {
            return Promise.resolve()
        }

        setEstimate(blockEstimate + API_READY_ESTIMATE)
        return new Promise((resolve) =>
            deployDataUnion({
                productId: productId || '',
                chainId,
                adminFee,
            })
                .onTransactionHash((contractAddress) => {
                    if (!isMounted()) {
                        return
                    }

                    // deployDataUnion() returns the calculated contract address as the tx hash,
                    // set it here to make sure we save it if the transaction wouldn't have time to complete
                    setAddress(contractAddress)
                    setStep(steps.COMPLETE)
                    Activity.push({
                        action: actionTypes.DEPLOY,
                        resourceId: productId,
                        resourceType: resourceTypes.PRODUCT,
                    })
                    resolve()
                })
                .onTransactionComplete(({ contractAddress }) => {
                    if (!isMounted()) {
                        return
                    }

                    // the new contract address is valid by this point and should match the calculated
                    // address but save it once more just to be sure
                    setAddress(contractAddress)
                    // Redirect back to product but allow the api to start up
                    setTimeout(() => {
                        if (isMounted() && onCloseRef.current) {
                            onCloseRef.current()
                        }
                    }, API_READY_ESTIMATE * 1000)
                })
                .onError((e) => {
                    if (!isMounted()) {
                        return
                    }

                    setAddress(null) // clear beneficiary address

                    setDeployError(e)
                    console.error(e)
                    resolve()
                }),
        )
    }, [isMounted, productId, adminFee, chainId])
    const onGuideContinue = useCallback(
        (dontShow) => {
            setSkipGuide(dontShow)
            return onDeploy()
        },
        [onDeploy],
    )
    // Update beneficiary address to product as soon as it changes
    useEffect(() => {
        if (address === null || (!!address && isEthereumAddress(address))) {
            updateAddress(address)
        }
    }, [address, updateAddress])
    const { switchChain, switchPending } = useSwitchChain()

    if (!checkingWeb3 && web3Error) {
        if (web3Error instanceof WrongNetworkSelectedError) {
            return (
                <WrongNetworkSelectedDialog
                    onClose={onClose}
                    onSwitch={() => switchChain(web3Error.requiredNetwork)}
                    switching={switchPending}
                    requiredNetwork={web3Error.requiredNetwork}
                    currentNetwork={web3Error.currentNetwork}
                />
            )
        }

        return <Web3ErrorDialog onClose={onClose} error={web3Error} />
    }

    if (deployError) {
        return <ErrorDialog message={deployError.message} onClose={onClose} />
    }

    switch (step) {
        case steps.GUIDE:
            return (
                <GuidedDeployDataUnionDialog
                    disabled={checkingWeb3}
                    dontShowAgain={dontShowAgain}
                    product={product}
                    onContinue={onGuideContinue}
                    onClose={onClose}
                />
            )

        case steps.CONFIRM:
            return (
                <ConfirmDeployDataUnionDialog
                    disabled={checkingWeb3}
                    product={product}
                    onContinue={onDeploy}
                    onShowGuidedDialog={() => setStep(steps.GUIDE)}
                    onClose={onClose}
                />
            )

        case steps.COMPLETE:
            return (
                <DeployingDataUnionDialog
                    product={product}
                    estimate={estimate}
                    onContinue={() => api.close(true)}
                    onClose={onClose}
                    minimized={dontShowAgain}
                />
            )

        default:
            return null
    }
}

const DeployDataUnionModal = () => {
    const { api, isOpen, value } = useModal('dataUnion.DEPLOY')

    if (!isOpen) {
        return null
    }

    const { product, updateAddress } = value
    return <DeployDialog product={product} api={api} onClose={() => api.close(false)} updateAddress={updateAddress} />
}

export default DeployDataUnionModal
