'use client';

import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { database } from '@/api/database';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { Table } from '@/components/Table';
import styles from './page.module.css';

interface UtilityPrice {
    id: string;
    utility_type: string;
    price_per_unit: number;
    effective_date: string;
    created_at: string | null;
}

export default function SettingsPage() {
    const [showAddForm, setShowAddForm] = useState(false);
    const [utilityType, setUtilityType] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [effectiveDate, setEffectiveDate] = useState('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('utility_prices')
            .select('*')
            .order('effective_date', { ascending: false });

        return { data, error };
    }, []);

    const [addState, handleAddPrice] = useAsyncFn(async () => {
        const { error } = await database
            .from('utility_prices')
            .insert({
                utility_type: utilityType,
                price_per_unit: parseFloat(pricePerUnit),
                effective_date: effectiveDate
            });

        return { error };
    }, [utilityType, pricePerUnit, effectiveDate]);

    const prices = state.value?.data ?? [];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatUtilityType = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const onAddPrice = async () => {
        const result = await handleAddPrice();
        result.error ? null : (
            setSuccessMessage('Utility price added successfully!'),
            setShowAddForm(false),
            setUtilityType(''),
            setPricePerUnit(''),
            setEffectiveDate(''),
            setTimeout(() => setSuccessMessage(''), 3000),
            state.loading ? null : window.location.reload()
        );
    };

    const columns = [
        {
            key: 'utility_type',
            header: 'Utility Type',
            render: (item: UtilityPrice) => (
                <span className={styles.utilityBadge}>
                    {formatUtilityType(item.utility_type)}
                </span>
            )
        },
        {
            key: 'price_per_unit',
            header: 'Price Per Unit',
            render: (item: UtilityPrice) => `$${item.price_per_unit.toFixed(4)}`
        },
        {
            key: 'effective_date',
            header: 'Effective Date',
            render: (item: UtilityPrice) => formatDate(item.effective_date)
        },
        {
            key: 'created_at',
            header: 'Created At',
            render: (item: UtilityPrice) => item.created_at ? formatDate(item.created_at) : 'N/A'
        }
    ];

    return state.loading ? <Loading message="Loading settings..." /> :
        state.error ? <ErrorBanner msg={state.error.message} /> : (
            <div className={styles.container}>
                <h1 className={styles.title}>System Settings</h1>

                {successMessage && <SuccessBanner msg={successMessage} />}
                {addState.error && <ErrorBanner msg={addState.error.message} />}

                <Card title="Utility Prices">
                    <div className={styles.cardHeader}>
                        <p className={styles.description}>
                            Manage utility pricing for billing calculations. Historical prices are preserved.
                        </p>
                        {!showAddForm && (
                            <Button
                                label="+ Add New Price"
                                onClick={() => setShowAddForm(true)}
                                variant="primary"
                            />
                        )}
                    </div>

                    {showAddForm && (
                        <div className={styles.addForm}>
                            <h3 className={styles.formTitle}>Add New Utility Price</h3>
                            <div className={styles.formGrid}>
                                <FormInput
                                    label="Utility Type"
                                    type="select"
                                    value={utilityType}
                                    onChange={setUtilityType}
                                    options={[
                                        { value: 'electricity', label: 'Electricity' },
                                        { value: 'water', label: 'Water' },
                                        { value: 'gas', label: 'Gas' },
                                        { value: 'heating', label: 'Heating' }
                                    ]}
                                    required
                                />
                                <FormInput
                                    label="Price Per Unit"
                                    type="number"
                                    value={pricePerUnit}
                                    onChange={setPricePerUnit}
                                    placeholder="0.0000"
                                    required
                                />
                                <FormInput
                                    label="Effective Date"
                                    type="date"
                                    value={effectiveDate}
                                    onChange={setEffectiveDate}
                                    required
                                />
                            </div>
                            <div className={styles.formButtons}>
                                <Button
                                    label="Cancel"
                                    onClick={() => setShowAddForm(false)}
                                    variant="secondary"
                                />
                                <Button
                                    label={addState.loading ? 'Adding...' : 'Add Price'}
                                    onClick={onAddPrice}
                                    variant="primary"
                                    disabled={addState.loading || !utilityType || !pricePerUnit || !effectiveDate}
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.tableWrapper}>
                        <Table
                            columns={columns}
                            data={prices}
                            emptyMessage="No utility prices configured"
                        />
                    </div>
                </Card>
            </div>
        );
}
