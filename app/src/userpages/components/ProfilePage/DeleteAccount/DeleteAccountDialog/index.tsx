import React, { useState, useCallback, FunctionComponent } from 'react'
import { useDispatch } from 'react-redux'
import ConfirmDialog from '$shared/components/ConfirmDialog'
import ConfirmCheckbox from '$shared/components/ConfirmCheckbox'
import { deleteUserAccount } from '$shared/modules/user/actions'
import usePending from '$shared/hooks/usePending'
import useModal from '$shared/hooks/useModal'
import styles from './deleteAccountDialog.pcss'
export const DeleteAccountDialogComponent: FunctionComponent<{
  waiting?: boolean
  onClose: () => void
  onSave: () => void | Promise<void>
}> = ({ waiting, onClose, onSave }) => {
    const [confirmed, setConfirmed] = useState(false)
    return (
        <ConfirmDialog
            title="Are you sure?"
            onReject={onClose}
            onAccept={onSave}
            message={
                <div>
                    <p className={styles.deleteWarning}>
                        This is an unrecoverable action. Please check the box to confirm you want to delete your
                        account.
                    </p>
                    <ConfirmCheckbox
                        title="I’m sure, go ahead and delete my account"
                        subtitle="Streamr cannot recover it once deleted"
                        onToggle={setConfirmed}
                        className={styles.confirmCheckbox}
                        disabled={!!waiting}
                    />
                </div>
            }
            acceptButton={{
                title: 'Delete account',
                kind: 'destructive',
                disabled: !confirmed || !!waiting,
                spinner: !!waiting,
            }}
        />
    )
}
type ContainerProps = {
    api: Record<string, any>
}

const DeleteAccountDialog = ({ api }: ContainerProps) => {
    const { isPending, wrap } = usePending('user.DELETE_ACCOUNT')
    const dispatch = useDispatch()
    const onSave = useCallback(
        async () =>
            wrap(async () => {
                let deleted = false
                let error

                try {
                    await dispatch(deleteUserAccount())
                    deleted = true
                } catch (e) {
                    console.warn(e)
                    error = e
                } finally {
                    api.close({
                        deleted,
                        error,
                    })
                }
            }),
        [dispatch, wrap, api],
    )
    const onClose = useCallback(() => {
        api.close({
            deleted: false,
            error: undefined,
        })
    }, [api])
    return <DeleteAccountDialogComponent onClose={onClose} onSave={onSave} waiting={isPending} />
}

const DeleteAccountDialogWrap: FunctionComponent = () => {
    const { api, isOpen } = useModal('userpages.deleteAccount')

    if (!isOpen) {
        return null
    }

    return <DeleteAccountDialog api={api} />
}

export default DeleteAccountDialogWrap
