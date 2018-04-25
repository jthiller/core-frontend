// @flow

import React from 'react'
import classNames from 'classnames'
import BN from 'bignumber.js'

import { Form, FormGroup, Label } from '@streamr/streamr-layout'

import { toSeconds } from '../../../utils/time'
import { dataToUsd, usdToData } from '../../../utils/price'
import { currencies, timeUnits } from '../../../utils/constants'
import type { Product } from '../../../flowtype/product-types'
import type { TimeUnit } from '../../../flowtype/common-types'
import Dialog from '../Dialog'

import style from './choose-access-period.pcss'

export type Props = {
    dataPerUsd: ?number,
    product: Product,
    onNext: (time: number, timeUnit: TimeUnit) => void,
    onCancel: () => void,
}

type State = {
    time: number,
    timeUnit: TimeUnit,
}

class ChooseAccessPeriod extends React.Component<Props, State> {
    static parsePrice = (time: number, timeUnit: TimeUnit, pricePerSecond: BN) => (
        !Number.isNaN(time) ? toSeconds(time, timeUnit).multipliedBy(pricePerSecond) : '-'
    )

    state = {
        time: 1,
        timeUnit: 'hour',
    }

    render() {
        const { product, onNext, onCancel, dataPerUsd } = this.props
        const { time, timeUnit } = this.state
        if (!dataPerUsd) {
            // is probably just loading
            return null
        }

        const pricePerSecondInData = product.priceCurrency === currencies.DATA ?
            product.pricePerSecond :
            usdToData(product.pricePerSecond, dataPerUsd)

        const pricePerSecondInUsd = product.priceCurrency === currencies.USD ?
            product.pricePerSecond :
            dataToUsd(product.pricePerSecond, dataPerUsd)

        return (
            <Dialog
                onClose={onCancel}
                title="Choose your access period"
                actions={{
                    cancel: {
                        title: 'Cancel',
                        onClick: onCancel,
                    },
                    next: {
                        title: 'Next',
                        color: 'primary',
                        onClick: () => onNext(time, timeUnit),
                        disabled: Number.isNaN(time),
                    },
                }}
            >
                <Form>

                    <FormGroup className={style.accessPeriodNumberSelector}>
                        <div>
                            <input
                                className={style.accessPeriodNumber}
                                type="text"
                                name="time"
                                id="time"
                                min={1}
                                value={!Number.isNaN(time) ? time : ''}
                                onChange={(e: SyntheticInputEvent<EventTarget>) => this.setState({
                                    time: parseInt(e.target.value, 10),
                                })}
                                onBlur={(e: SyntheticInputEvent<EventTarget>) => {
                                    if (parseInt(e.target.value, 10) <= 1) {
                                        this.setState({
                                            time: 1,
                                        })
                                    }
                                }}
                            />
                        </div>
                    </FormGroup>

                    <FormGroup tag="fieldset" className={style.timeUnitFieldset}>
                        <div className={style.timeUnitSelectionCol}>
                            {['hour', 'day', 'week', 'month'].map((unit) => (

                                <Label
                                    className={
                                        classNames({
                                            [style.timeUnitSelection]: true,
                                            [style.timeUnitSelectionActive]: this.state.timeUnit === unit,
                                        })
                                    }
                                    check
                                    key={unit}
                                >
                                    <input
                                        className={style.hiddenRadioButton}
                                        type="radio"
                                        name="timeUnit"
                                        value={unit}
                                        onChange={(e: SyntheticInputEvent<EventTarget>) => this.setState({
                                            timeUnit: (((e.target.value): any): TimeUnit),
                                        })}
                                    />
                                    {timeUnits[unit]}
                                </Label>

                            ))}

                            <div className={style.priceLabels}>
                                <div>
                                    <span>
                                        {ChooseAccessPeriod.parsePrice(time, timeUnit, pricePerSecondInData)}
                                    </span>
                                    DATA
                                </div>

                                <div>
                                    <span>
                                        {ChooseAccessPeriod.parsePrice(time, timeUnit, pricePerSecondInUsd)}
                                    </span>
                                    USD
                                </div>

                            </div>
                        </div>
                    </FormGroup>
                </Form>

            </Dialog>
        )
    }
}

export default ChooseAccessPeriod
