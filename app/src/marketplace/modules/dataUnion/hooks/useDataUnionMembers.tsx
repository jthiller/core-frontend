import React, { useMemo, useCallback, useState, useContext, useRef, useEffect } from 'react'
import { useThrottledCallback } from 'use-debounce'
import useIsMounted from '$shared/hooks/useIsMounted'
import { getMemberStatuses, addMembers, removeMembers, searchDataUnionMembers, getSelectedMemberStatuses } from '../services'
const DataUnionMembersContext = React.createContext({})
const VISIBLE_MEMBERS_LIMIT = 100

function useDataUnionMembers() {
    const isMounted = useIsMounted()
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState([])
    const generator = useRef(null)
    const membersRef = useRef([])
    const updateDataToState = useThrottledCallback((data) => {
        setMembers([...data.slice(0, VISIBLE_MEMBERS_LIMIT)])
    }, 100)
    const reset = useCallback(() => {
        setMembers([])
        membersRef.current = []
    }, [])
    useEffect(
        () => () => {
            // Cancel generators on unmount
            if (generator.current != null) {
                generator.current.return('Canceled')
                generator.current = null
            }
        },
        [],
    )
    const load = useCallback(
        async (dataUnionId, chainId) => {
            setLoading(true)

            try {
                // Cancel previous generator
                if (generator.current != null) {
                    generator.current.return('Canceled')
                    generator.current = null
                    reset()
                }

                generator.current = getMemberStatuses(dataUnionId, chainId)

                // eslint-disable-next-line no-restricted-syntax
                for await (const event of generator.current) {
                    if (isMounted()) {
                        if (membersRef.current.find((m) => m.address === event.address) === undefined) {
                            membersRef.current.push(event)
                            updateDataToState(membersRef.current)
                        }
                    }
                }
            } catch (e) {
                console.warn(e)
                throw e
            } finally {
                if (isMounted()) {
                    setLoading(false)
                }
            }
        },
        [reset, isMounted, updateDataToState],
    )
    const add = useCallback(
        async (dataUnionId, chainId, memberAddresses) => {
            try {
                await addMembers(dataUnionId, chainId, memberAddresses)

                if (isMounted()) {
                    setMembers((prev) => ({
                        ...prev,
                        memberAddresses,
                    }))
                }
            } catch (e) {
                console.warn(e)
                throw e
            }
        },
        [isMounted],
    )
    const remove = useCallback(
        async (dataUnionId, chainId, memberAddresses) => {
            try {
                await removeMembers(dataUnionId, chainId, memberAddresses)

                if (isMounted()) {
                    setMembers((prev) => prev.filter((m) => !memberAddresses.includes(m.address)))
                }
            } catch (e) {
                console.warn(e)
                throw e
            }
        },
        [isMounted],
    )
    const search = useCallback(async (dataUnionId, text, chainId) => {
        const searchResults = await searchDataUnionMembers(dataUnionId, text, chainId)
        const resultsWithStatuses = await getSelectedMemberStatuses(
            dataUnionId,
            searchResults.slice(0, VISIBLE_MEMBERS_LIMIT),
            chainId,
        )
        return resultsWithStatuses
    }, [])
    return useMemo(
        () => ({
            loading,
            load,
            members,
            remove,
            reset,
            search,
        }),
        [loading, load, members, remove, reset, search],
    )
}

export const DataUnionMembersProvider = ({ children }) => (
    <DataUnionMembersContext.Provider value={useDataUnionMembers()}>
        {children || null}
    </DataUnionMembersContext.Provider>
)
export default function useDataUnionMembersContext() {
    return useContext(DataUnionMembersContext)
}
