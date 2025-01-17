import React, { useState, useMemo, useCallback } from 'react'
import classNames from 'classnames'
import uniq from 'lodash/uniq'
import sortBy from 'lodash/sortBy'
import { Input } from 'reactstrap'
import Button from '$shared/components/Button'
import Popover from '$shared/components/Popover'
import SvgIcon from '$shared/components/SvgIcon'
import Errors from '$ui/Errors'
import LoadingIndicator from '$shared/components/LoadingIndicator'
import { truncate } from '$shared/utils/text'
import type { LastErrorProps } from '$shared/hooks/useLastError'
import { useLastError } from '$shared/hooks/useLastError'
import type { Stream, StreamList, StreamIdList, StreamId } from '$shared/types/stream-types'
import PopoverItem from '$shared/components/Popover/PopoverItem'
import routes from '$routes'
import styles from './streamSelector.pcss'
type Props = LastErrorProps & {
    fetchingStreams?: boolean
    streams: StreamIdList
    availableStreams: StreamList
    className?: string
    onEdit: (arg0: StreamIdList) => void
    disabled?: boolean
}
const SORT_BY_NAME = 'name'
const SORT_BY_CREATED = 'created'
const SORT_BY_ADDED = 'added'
export const StreamSelector = (props: Props) => {
    const {
        className,
        streams,
        onEdit,
        availableStreams,
        fetchingStreams = false,
        disabled: disabledProp,
        ...rest
    } = props
    const [sort, setSort] = useState(SORT_BY_NAME)
    const [search, setSearch] = useState('')

    const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value)
    }

    const matchingStreams: StreamList = useMemo(
        () => availableStreams.filter((stream) => stream.id.toLowerCase().includes(search.toLowerCase())),
        [availableStreams, search],
    )
    const streamSet = useMemo(() => new Set(streams), [streams])
    const sortedStreams = useMemo(() => {
        let sortOptions

        if (sort === SORT_BY_ADDED) {
            sortOptions = ['isAdded', 'lowerName']
        }

        if (sort === SORT_BY_NAME) {
            sortOptions = ['lowerName']
        }

        if (sort === SORT_BY_CREATED) {
            sortOptions = ['lastUpdated']
        }

        return sortBy(
            matchingStreams.map((s) => ({
                ...s,
                lowerName: s.id.toLowerCase(),
                isAdded: -Number(streamSet.has(s.id)),
            })),
            sortOptions,
        )
    }, [sort, streamSet, matchingStreams])
    const onToggle = useCallback(
        (id: StreamId) => {
            onEdit(streams.includes(id) ? streams.filter((sid) => sid !== id) : uniq(streams.concat(id)))
        },
        [streams, onEdit],
    )
    const matchingNextStreams = useMemo(
        () => new Set(matchingStreams.filter((x) => streamSet.has(x.id))),
        [matchingStreams, streamSet],
    )
    const allVisibleStreamsSelected = useMemo(
        () => matchingNextStreams.size === matchingStreams.length,
        [matchingNextStreams, matchingStreams],
    )
    const onSelectAll = useCallback(
        (ids: StreamIdList) => {
            onEdit(uniq(streams.concat(ids)))
        },
        [onEdit, streams],
    )
    const onSelectNone = useCallback(
        (ids: StreamIdList) => {
            onEdit(uniq(streams.filter((id) => !ids.includes(id))))
        },
        [streams, onEdit],
    )
    const { hasError, error } = useLastError(rest)
    const isDisabled = disabledProp || fetchingStreams
    return (
        <React.Fragment>
            <div className={className}>
                <div
                    className={classNames(styles.root, {
                        [styles.withError]: !!hasError,
                        [styles.disabled]: !!isDisabled,
                    })}
                >
                    <div className={styles.inputContainer}>
                        <SvgIcon name="search" className={styles.SearchIcon} />
                        <div className={styles.inputWrapper}>
                            <Input
                                className={styles.input}
                                onChange={onSearchChange}
                                value={search}
                                placeholder="Type to search & select streams or click to select individually"
                                disabled={!!isDisabled}
                            />
                            <button
                                type="button"
                                className={styles.clearButton}
                                onClick={() => setSearch('')}
                                hidden={!search}
                            >
                                <SvgIcon name="cross" />
                            </button>
                        </div>
                        <Popover
                            className={classNames(styles.sortDropdown, styles.dropdown)}
                            title={
                                <span className={styles.sortDropdownTitle}>
                                    Sort by &nbsp;
                                    {sort}
                                </span>
                            }
                            disabled={!!isDisabled}
                        >
                            <PopoverItem onClick={() => setSort(SORT_BY_NAME)}>Name</PopoverItem>
                            <PopoverItem onClick={() => setSort(SORT_BY_CREATED)}>Created</PopoverItem>
                            <PopoverItem onClick={() => setSort(SORT_BY_ADDED)}>Added</PopoverItem>
                        </Popover>
                    </div>
                    <div
                        className={classNames(styles.streams, {
                            [styles.darkBgStreams]: !fetchingStreams && !sortedStreams.length,
                        })}
                    >
                        {!fetchingStreams && !sortedStreams.length && (
                            <div className={styles.noAvailableStreams}>
                                {!!search && <p>We couldn&apos;t find anything to match your search.</p>}
                                {!search && <p>You haven&apos;t created any streams yet.</p>}
                                {!search && (
                                    <Button tag="a" href={routes.streams.new()} kind="special" variant="light">
                                        Create a Stream
                                    </Button>
                                )}
                            </div>
                        )}
                        {sortedStreams.map((stream: Stream) => (
                            <div
                                key={stream.id}
                                className={classNames(styles.stream, {
                                    [styles.selected]: streamSet.has(stream.id),
                                })}
                                title={stream.description}
                            >
                                <button
                                    type="button"
                                    className={styles.addButton}
                                    onClick={() => {
                                        onToggle(stream.id)
                                    }}
                                    disabled={!!isDisabled}
                                >
                                    {truncate(stream.id)}
                                </button>
                            </div>
                        ))}
                        {!!fetchingStreams && <LoadingIndicator className={styles.loadingIndicator} loading />}
                    </div>
                    <div className={styles.footer}>
                        <div className={styles.selectedCount}>
                            {streamSet.size}
                            {streamSet.size === 1 ? ' stream ' : ' streams '}
                            selected
                        </div>
                        <Button
                            tag={'button'}
                            kind="secondary"
                            onClick={() => {
                                const toSelect = matchingStreams.map((s) => s.id)

                                if (allVisibleStreamsSelected) {
                                    onSelectNone(toSelect)
                                } else {
                                    onSelectAll(toSelect)
                                }
                            }}
                            disabled={!!isDisabled}
                        >
                            {!allVisibleStreamsSelected ? 'Select all' : 'Select none'}
                        </Button>
                    </div>
                </div>
            </div>
            <Errors>{!!hasError && error}</Errors>
        </React.Fragment>
    )
}
export default StreamSelector
