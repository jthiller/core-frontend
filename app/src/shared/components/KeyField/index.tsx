import React, { useState, useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { StatusIcon as UnstyledStatusIcon } from '@streamr/streamr-layout'
import { truncate } from '$shared/utils/text'
import Notification from '$shared/utils/Notification'
import { NotificationIcon } from '$shared/utils/constants'
import useIsMounted from '$shared/hooks/useIsMounted'
import useCopy from '$shared/hooks/useCopy'
import Label from '$ui/Label'
import WithInputActions from '$shared/components/WithInputActions'
import Text from '$ui/Text'
import PopoverItem from '../Popover/PopoverItem'
import type { LabelType } from './KeyFieldEditor'
import KeyFieldEditor, { keyValues } from './KeyFieldEditor'
const KeyFieldContainer = styled.div`
    position: relative;
`
const KeyNameHolder = styled.div``
const StatusIcon = styled(UnstyledStatusIcon)``
const LabelWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    ${StatusIcon} {
        width: 8px;
        height: 8px;
        margin-right: 8px;
        margin-bottom: 8px;
    }

    ${Label} {
        flex-grow: 1;
        margin-right: 0.5um;
        position: relative;
    }

    ${KeyNameHolder} {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        position: absolute;
        left: 0;
        top: 0;
    }
`
type Props = {
    keyName: string
    value?: string
    hideValue?: boolean
    className?: string
    allowEdit?: boolean
    onSave?: (key: string | null | undefined, value: string | null | undefined) => Promise<void>
    allowDelete?: boolean
    disableDelete?: boolean
    onDelete?: () => Promise<void>
    labelType: LabelType
    onToggleEditor?: (arg0: boolean) => void
    labelComponent?: any
    active?: boolean
}

const includeIf = (condition: boolean, elements: Array<any>) => (condition ? elements : [])

const UnstyledKeyField = ({
    keyName: keyNameProp,
    value: valueProp,
    hideValue,
    allowEdit,
    onSave: onSaveProp,
    allowDelete,
    disableDelete,
    onDelete: onDeleteProp,
    labelType,
    onToggleEditor: onToggleEditorProp,
    labelComponent,
    active,
    ...props
}: Props) => {
    const [waiting, setWaiting] = useState(false)
    const [hidden, setHidden] = useState(!!hideValue)
    const [editing, setEditing] = useState(false)
    const [error, setError] = useState(undefined)
    const isMounted = useIsMounted()
    const { copy } = useCopy()
    const toggleHidden = useCallback(() => {
        setHidden((wasHidden) => !wasHidden)
    }, [])
    useEffect(() => {
        if (onToggleEditorProp) {
            onToggleEditorProp(editing)
        }
    }, [editing, onToggleEditorProp])
    const notify = useCallback(() => {
        Notification.push({
            title: `${keyValues[labelType]} copied`,
            icon: NotificationIcon.CHECKMARK,
        })
    }, [labelType])
    const onCopy = useCallback(() => {
        copy(valueProp || '')
        notify()
    }, [copy, valueProp, notify])
    const onCancel = useCallback(() => {
        setEditing(false)
    }, [])
    const onSave = useCallback(
        async (keyName: string | null | undefined, value: string | null | undefined) => {
            if (allowEdit) {
                setError(undefined)

                if (onSaveProp) {
                    setWaiting(true)

                    try {
                        await onSaveProp(keyName, value)

                        if (isMounted()) {
                            setEditing(false)
                            setError(undefined)
                        }
                    } catch (e) {
                        if (isMounted()) {
                            setError(undefined)
                        }
                    } finally {
                        setWaiting(false)
                    }
                } else {
                    setEditing(false)
                }
            }
        },
        [allowEdit, onSaveProp, isMounted],
    )
    const onDelete = useCallback(() => {
        if (allowDelete && onDeleteProp) {
            onDeleteProp()
        }
    }, [allowDelete, onDeleteProp])
    const onEdit = useCallback(() => {
        setEditing(true)
    }, [])
    const revealAction = useMemo(
        () => (
            <PopoverItem key="reveal" onClick={toggleHidden}>
                {hidden ? 'Reveal' : 'Conceal'}
            </PopoverItem>
        ),
        [toggleHidden, hidden],
    )
    const editAction = useMemo(
        () => (
            <PopoverItem key="edit" onClick={onEdit}>
                Edit
            </PopoverItem>
        ),
        [onEdit],
    )
    const deleteAction = useMemo(
        () => (
            <PopoverItem key="delete" onClick={onDelete} disabled={disableDelete}>
                Delete
            </PopoverItem>
        ),
        [onDelete, disableDelete],
    )
    const inputActions = useMemo(
        () => [
            ...includeIf(!!hideValue, [revealAction]),
            <PopoverItem key="copy" onClick={onCopy}>
                Copy
            </PopoverItem>,
            ...includeIf(!!allowEdit, [editAction]),
            ...includeIf(!!allowDelete, [deleteAction]),
        ],
        [hideValue, revealAction, onCopy, allowEdit, editAction, allowDelete, deleteAction],
    )
    return (
        <div {...props}>
            {!editing ? (
                <KeyFieldContainer>
                    <LabelWrapper>
                        {!!active && <StatusIcon status={StatusIcon.OK} />}
                        <Label htmlFor="keyName">
                            &zwnj;
                            <KeyNameHolder>{keyNameProp}</KeyNameHolder>
                        </Label>
                        <div>{labelComponent}</div>
                    </LabelWrapper>
                    <WithInputActions actions={inputActions}>
                        <Text value={valueProp && truncate(valueProp)} readOnly type={hidden ? 'password' : 'text'} />
                    </WithInputActions>
                </KeyFieldContainer>
            ) : (
                <KeyFieldEditor
                    keyName={keyNameProp}
                    value={valueProp}
                    onCancel={onCancel}
                    onSave={onSave}
                    waiting={waiting}
                    error={error}
                    labelType={labelType}
                />
            )}
        </div>
    )
}

UnstyledKeyField.defaultProps = {
    labelType: 'apiKey',
}
const KeyField = styled(UnstyledKeyField)``
export default KeyField
