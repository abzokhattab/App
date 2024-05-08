import React, {useEffect, useMemo} from 'react';
import {useOnyx} from 'react-native-onyx';
import Text from '@components/Text';
import type {UnitItemType} from '@components/UnitPicker';
import UnitPicker from '@components/UnitPicker';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import type {WithPolicyProps} from '@pages/workspace/withPolicy';
import withPolicy from '@pages/workspace/withPolicy';
import WorkspacePageWithSections from '@pages/workspace/WorkspacePageWithSections';
import * as Policy from '@userActions/Policy';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';

type WorkspaceUnitPageBaseProps = WithPolicyProps;

type WorkspaceUnitPageProps = WorkspaceUnitPageBaseProps;
function WorkspaceUnitPage(props: WorkspaceUnitPageProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const [workspaceRateAndUnit] = useOnyx(ONYXKEYS.WORKSPACE_RATE_AND_UNIT);

    useEffect(() => {
        if (workspaceRateAndUnit?.policyID === props.policy?.id) {
            return;
        }
        Policy.setPolicyIDForReimburseView(props.policy?.id ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateUnit = (unit: UnitItemType) => {
        Policy.setUnitForReimburseView(unit.value);
        Navigation.goBack(ROUTES.WORKSPACE_RATE_AND_UNIT.getRoute(props.policy?.id ?? ''));
    };

    const defaultValue = useMemo(() => {
        const defaultDistanceCustomUnit = Object.values(props.policy?.customUnits ?? {}).find((unit) => unit.name === CONST.CUSTOM_UNITS.NAME_DISTANCE);
        return defaultDistanceCustomUnit?.attributes.unit ?? CONST.CUSTOM_UNITS.DISTANCE_UNIT_MILES;
    }, [props.policy?.customUnits]);

    return (
        <WorkspacePageWithSections
            headerText={translate('workspace.reimburse.trackDistanceUnit')}
            route={props.route}
            guidesCallTaskID={CONST.GUIDES_CALL_TASK_IDS.WORKSPACE_REIMBURSE}
            shouldSkipVBBACall
            backButtonRoute={ROUTES.WORKSPACE_RATE_AND_UNIT.getRoute(props.policy?.id ?? '')}
            shouldShowLoading={false}
            shouldShowBackButton
        >
            {() => (
                <>
                    <Text style={[styles.mh5, styles.mv4]}>{translate('workspace.reimburse.trackDistanceChooseUnit')}</Text>
                    <UnitPicker
                        defaultValue={workspaceRateAndUnit?.unit ?? defaultValue}
                        onOptionSelected={updateUnit}
                    />
                </>
            )}
        </WorkspacePageWithSections>
    );
}

WorkspaceUnitPage.displayName = 'WorkspaceUnitPage';

export default withPolicy(WorkspaceUnitPage);
