import React, {useState} from 'react';
import {View} from 'react-native';
import CheckboxWithLabel from '@components/CheckboxWithLabel';
import ConfirmModal from '@components/ConfirmModal';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import * as User from '@userActions/User';

type EmptyReportConfirmationModalProps = {
    /** Whether the modal is visible */
    isVisible: boolean;
    /** Callback to call when the user confirms */
    onConfirm: () => void;
    /** Callback to call when the user cancels */
    onCancel: () => void;
};

function EmptyReportConfirmationModal({isVisible, onConfirm, onCancel}: EmptyReportConfirmationModalProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleConfirm = () => {
        if (dontShowAgain) {
            User.setDismissedEmptyReportConfirmation(true);
        }
        onConfirm();
    };

    const handleCancel = () => {
        setDontShowAgain(false);
        onCancel();
    };

    return (
        <ConfirmModal
            isVisible={isVisible}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            title={translate('report.emptyReportConfirmation.title')}
            confirmText={translate('report.emptyReportConfirmation.createReport')}
            cancelText={translate('report.emptyReportConfirmation.cancel')}
            shouldShowCancelButton
            prompt={
                <View>
                    <Text style={[styles.mb4]}>{translate('report.emptyReportConfirmation.message')}</Text>
                    <CheckboxWithLabel
                        isChecked={dontShowAgain}
                        onInputChange={(value) => setDontShowAgain(!!value)}
                        label={translate('report.emptyReportConfirmation.dontShowAgain')}
                    />
                </View>
            }
        />
    );
}

EmptyReportConfirmationModal.displayName = 'EmptyReportConfirmationModal';

export default EmptyReportConfirmationModal;
