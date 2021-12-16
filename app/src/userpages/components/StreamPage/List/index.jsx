import React, { Fragment, useEffect, useState, useCallback, useMemo, useRef, useReducer } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useClient } from 'streamr-client-react'

import { CoreHelmet } from '$shared/components/Helmet'
import { getFilters } from '$userpages/utils/constants'
import Popover from '$shared/components/Popover'
import Layout from '$userpages/components/Layout'
import DocsShortcuts from '$userpages/components/DocsShortcuts'
import LoadMore from '$mp/components/LoadMore'
import ListContainer from '$shared/components/Container/List'
import Button from '$shared/components/Button'
import useFilterSort from '$userpages/hooks/useFilterSort'
import Sidebar from '$shared/components/Sidebar'
import SidebarProvider, { useSidebar } from '$shared/components/Sidebar/SidebarProvider'
import ShareSidebar from '$userpages/components/ShareSidebar'
import { MD, LG } from '$shared/utils/styled'
import { StreamList as StreamListComponent } from '$shared/components/List'
import { getParamsForFilter } from '$userpages/utils/filters'
import Notification from '$shared/utils/Notification'
import { NotificationIcon } from '$shared/utils/constants'
import { truncate } from '$shared/utils/text'
import useIsMounted from '$shared/hooks/useIsMounted'
import routes from '$routes'

import Search from '../../Header/Search'
import SwitchNetworkModal from '../SwitchNetworkModal'

import SnippetDialog from './SnippetDialog'
import Row from './Row'
import NoStreamsView from './NoStreams'

const DesktopOnlyButton = styled(Button)`
    && {
        display: none;
    }

    @media (min-width: ${LG}px) {
        && {
            display: inline-flex;
        }
    }
`

export const CreateStreamButton = () => (
    <DesktopOnlyButton
        tag={Link}
        to={routes.streams.new()}
    >
        Create stream
    </DesktopOnlyButton>
)

const StyledListContainer = styled(ListContainer)`
    && {
        padding: 0;
        margin-bottom: 4em;
    }

    @media (min-width: ${MD}px) {
        && {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
        }
    }

    @media (min-width: ${LG}px) {
        && {
            margin-bottom: 0;
        }
    }
`

// Hides sort dropdown in desktop mode, table headers can be used for sorting
const TabletPopover = styled(Popover)`
    @media (min-width: ${LG}px) {
        display: none;
    }
`

function StreamPageSidebar({ stream, onInvalidate }) {
    const sidebar = useSidebar()

    const streamId = stream && stream.id

    const onClose = useCallback(() => {
        sidebar.close()

        if (streamId) {
            onInvalidate(streamId)
        }
    }, [sidebar, onInvalidate, streamId])

    return (
        <Sidebar.WithErrorBoundary
            isOpen={sidebar.isOpen()}
            onClose={onClose}
        >
            {sidebar.isOpen('share') && (
                <ShareSidebar
                    sidebarName="share"
                    resourceTitle={stream && truncate(stream.id)}
                    resourceType="STREAM"
                    resourceId={stream && stream.id}
                    onClose={onClose}
                />
            )}
        </Sidebar.WithErrorBoundary>
    )
}

const PAGE_SIZE = 20

const streamsReducer = (state, action) => {
    switch (action.type) {
        case 'startFetching':
            return {
                ...state,
                fetching: true,
            }

        case 'setStreams': {
            const nextStreams = action.streams.slice(0, PAGE_SIZE)

            return {
                ...state,
                streams: action.replace ? nextStreams : [...state.streams, ...nextStreams],
                fetching: false,
                hasMoreResults: action.streams.length > PAGE_SIZE,
            }
        }

        case 'endFetching':
            return {
                ...state,
                fetching: false,
            }

        case 'removeStream':
            return {
                ...state,
                streams: state.streams.filter(({ id }) => id !== action.streamId),
            }

        case 'invalidateStreamPermissions':
            return {
                ...state,
                invalidatedStreams: {
                    ...state.invalidatedStreams,
                    [action.streamId]: (state.invalidatedStreams[action.streamId] || 0) + 1,
                },
            }

        default:
            break
    }

    return {
        ...state,
    }
}

const StreamList = () => {
    const client = useClient()
    const isMounted = useIsMounted()
    const filters = useMemo(() => getFilters('stream'), [])
    const allSortOptions = useMemo(() => ([
        filters.RECENT_DESC,
        filters.RECENT_ASC,
        filters.NAME_ASC,
        filters.NAME_DESC,
    ]), [filters])
    const dropdownSortOptions = useMemo(() => ([
        filters.RECENT_DESC,
        filters.NAME_ASC,
        filters.NAME_DESC,
    ]), [filters])

    const {
        defaultFilter,
        filter,
        setSearch,
        setSort,
        resetFilter,
    } = useFilterSort(allSortOptions)
    const [dialogTargetStream, setDialogTargetStream] = useState(null)

    const [{ streams, fetching, hasMoreResults, invalidatedStreams }, dispatch] = useReducer(streamsReducer, {
        streams: [],
        fetching: false,
        hasMoreResults: false,
        invalidatedStreams: {},
    })
    const offsetRef = useRef()
    offsetRef.current = streams.length

    const fetchStreams = useCallback(async ({ replace = false, filter = {} } = {}) => {
        try {
            dispatch({
                type: 'startFetching',
            })
            const params = getParamsForFilter(filter, {
                uiChannel: false,
                sortBy: 'lastUpdated',
            })
            let offset = offsetRef.current

            // If we are replacing, reset the offset before API call
            if (replace) {
                offset = 0
            }

            // TODO: ordering not supported by the client
            delete params.sortBy

            const nextStreams = await client.listStreams({
                ...params,
                max: PAGE_SIZE + 1, // query 1 extra element to determine if we should show "load more" button
                offset,
            })

            if (isMounted()) {
                dispatch({
                    type: 'setStreams',
                    streams: nextStreams,
                    replace,
                })
            }
        } catch (e) {
            console.warn(e)

            Notification.push({
                title: 'Failed to fetch streams',
                icon: NotificationIcon.ERROR,
            })
        } finally {
            if (isMounted()) {
                dispatch({
                    type: 'endFetching',
                })
            }
        }
    }, [dispatch, client, isMounted])

    useEffect(() => {
        fetchStreams({
            replace: true,
            filter,
        })
    }, [fetchStreams, filter])

    const [activeSort, setActiveSort] = useState(undefined)

    const sidebar = useSidebar()

    const onOpenShareDialog = useCallback((stream) => {
        setDialogTargetStream(stream)
        sidebar.open('share')
    }, [sidebar])

    const onDropdownSort = useCallback((value) => {
        setActiveSort(value)
        setSort(value)
    }, [setSort])

    const onHeaderSortUpdate = useCallback((asc, desc) => {
        setActiveSort((prevFilter) => {
            let nextSort

            if (![asc, desc].includes(prevFilter)) {
                nextSort = asc
            } else if (prevFilter === asc) {
                nextSort = desc
            }

            setSort(nextSort || (defaultFilter && defaultFilter.id))
            return nextSort
        })
    }, [setActiveSort, setSort, defaultFilter])

    const onRemoveStream = useCallback(({ id }) => {
        if (id) {
            dispatch({
                type: 'removeStream',
                streamId: id,
            })
        }
    }, [dispatch])

    const onInvalidate = useCallback((streamId) => {
        dispatch({
            type: 'invalidateStreamPermissions',
            streamId,
        })
    }, [dispatch])

    return (
        <Layout
            headerAdditionalComponent={<CreateStreamButton />}
            headerSearchComponent={
                <Search.Active
                    placeholder="Filter streams"
                    value={(filter && filter.search) || ''}
                    onChange={setSearch}
                />
            }
            headerFilterComponent={
                <TabletPopover
                    title="Sort by"
                    type="uppercase"
                    caret="svg"
                    activeTitle
                    onChange={onDropdownSort}
                    selectedItem={(filter && filter.id) || (defaultFilter && defaultFilter.id)}
                    menuProps={{
                        right: true,
                    }}
                >
                    {dropdownSortOptions.map((s) => (
                        <Popover.Item key={s.filter.id} value={s.filter.id}>
                            {s.displayName}
                        </Popover.Item>
                    ))}
                </TabletPopover>
            }
            loading={fetching}
        >
            <CoreHelmet title="Streams" />
            <StyledListContainer>
                {!fetching && streams && streams.length <= 0 && (
                    <NoStreamsView
                        hasFilter={!!filter && (!!filter.search || !!filter.key)}
                        filter={filter}
                        onResetFilter={resetFilter}
                    />
                )}
                {streams && streams.length > 0 && (
                    <Fragment>
                        <StreamListComponent>
                            <StreamListComponent.Header>
                                <StreamListComponent.HeaderItem
                                    asc={filters.NAME_ASC.filter.id}
                                    desc={filters.NAME_DESC.filter.id}
                                    active={activeSort}
                                    onClick={onHeaderSortUpdate}
                                >
                                    Name
                                </StreamListComponent.HeaderItem>
                                <StreamListComponent.HeaderItem>
                                    Description
                                </StreamListComponent.HeaderItem>
                                <StreamListComponent.HeaderItem
                                    asc={filters.RECENT_ASC.filter.id}
                                    desc={filters.RECENT_DESC.filter.id}
                                    active={activeSort}
                                    onClick={onHeaderSortUpdate}
                                >
                                    Updated
                                </StreamListComponent.HeaderItem>
                                <StreamListComponent.HeaderItem>
                                    Last Data
                                </StreamListComponent.HeaderItem>
                                <StreamListComponent.HeaderItem center>
                                    Status
                                </StreamListComponent.HeaderItem>
                            </StreamListComponent.Header>
                            {streams.map((stream) => {
                                // invalidate component when share dialog is closed to fetch new permissions
                                const updateKey = invalidatedStreams[stream.id] || 0

                                return (
                                    <Row
                                        key={`${stream.id}-${updateKey}`}
                                        onShareClick={onOpenShareDialog}
                                        onRemoveStream={onRemoveStream}
                                        stream={stream}
                                    />
                                )
                            })}
                        </StreamListComponent>
                        <LoadMore
                            hasMoreSearchResults={!fetching && hasMoreResults}
                            onClick={() => fetchStreams({
                                filter,
                            })}
                            preserveSpace
                        />
                    </Fragment>
                )}
            </StyledListContainer>
            <SnippetDialog />
            <SwitchNetworkModal />
            <StreamPageSidebar stream={dialogTargetStream} onInvalidate={onInvalidate} />
            <DocsShortcuts />
        </Layout>
    )
}

export default (props) => (
    <SidebarProvider>
        <StreamList {...props} />
    </SidebarProvider>
)
