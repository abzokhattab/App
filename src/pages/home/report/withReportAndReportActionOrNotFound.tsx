/* eslint-disable rulesdir/no-negated-variables */
import type {StackScreenProps} from '@react-navigation/stack';
import type {ComponentType, ForwardedRef, RefAttributes} from 'react';
import React, {useCallback, useEffect} from 'react';
import type {OnyxEntry} from 'react-native-onyx';
import {useOnyx} from 'react-native-onyx';
import FullscreenLoadingIndicator from '@components/FullscreenLoadingIndicator';
import withWindowDimensions from '@components/withWindowDimensions';
import type {WindowDimensionsProps} from '@components/withWindowDimensions/types';
import getComponentDisplayName from '@libs/getComponentDisplayName';
import type {FlagCommentNavigatorParamList, SplitDetailsNavigatorParamList} from '@libs/Navigation/types';
import * as ReportUtils from '@libs/ReportUtils';
import NotFoundPage from '@pages/ErrorPage/NotFoundPage';
import * as Report from '@userActions/Report';
import ONYXKEYS from '@src/ONYXKEYS';
import type SCREENS from '@src/SCREENS';
import type * as OnyxTypes from '@src/types/onyx';
import {isEmptyObject} from '@src/types/utils/EmptyObject';

type WithReportAndReportActionOrNotFoundProps = WindowDimensionsProps &
    StackScreenProps<FlagCommentNavigatorParamList & SplitDetailsNavigatorParamList, typeof SCREENS.FLAG_COMMENT_ROOT | typeof SCREENS.SPLIT_DETAILS.ROOT>;

export default function <TProps extends WithReportAndReportActionOrNotFoundProps, TRef>(
    WrappedComponent: ComponentType<TProps & RefAttributes<TRef>>,
): ComponentType<TProps & RefAttributes<TRef>> {
    function WithReportOrNotFound(props: TProps, ref: ForwardedRef<TRef>) {
        const reportID = props.route.params.reportID;
        const [report] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${reportID}`);
        const [parentReport] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${report ? report.parentReportID : '0'}`);
        const [reportMetadata] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT_METADATA}${reportID}`);
        const [isLoadingReportData] = useOnyx(ONYXKEYS.IS_LOADING_REPORT_DATA);
        const [betas] = useOnyx(ONYXKEYS.BETAS);
        const [policies] = useOnyx(ONYXKEYS.COLLECTION.POLICY);
        const [reportActions] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${reportID}`, {canEvict: false});
        const [parentReportAction] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${report ? report.parentReportID : 0}`, {
            selector: (parentReportActions: OnyxEntry<OnyxTypes.ReportActions>): OnyxEntry<OnyxTypes.ReportAction> => {
                const parentReportActionID = report?.parentReportActionID;
                if (!parentReportActionID) {
                    return null;
                }
                return parentReportActions?.[parentReportActionID] ?? null;
            },
            canEvict: false,
        });

        const getReportAction = useCallback(() => {
            let reportAction: OnyxTypes.ReportAction | Record<string, never> | undefined = reportActions?.[`${props.route.params.reportActionID}`];

            // Handle threads if needed
            if (!reportAction?.reportActionID) {
                reportAction = parentReportAction ?? {};
            }

            return reportAction;
        }, [reportActions, props.route.params.reportActionID, parentReportAction]);

        const reportAction = getReportAction();

        // For small screen, we don't call openReport API when we go to a sub report page by deeplink
        // So we need to call openReport here for small screen
        useEffect(() => {
            if (!props.isSmallScreenWidth || (!isEmptyObject(report) && !isEmptyObject(reportAction))) {
                return;
            }
            Report.openReport(props.route.params.reportID);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [props.isSmallScreenWidth, props.route.params.reportID]);

        // Perform all the loading checks
        const isLoadingReport = isLoadingReportData && !report?.reportID;
        const isLoadingReportAction = isEmptyObject(reportActions) || (reportMetadata?.isLoadingInitialReportActions && isEmptyObject(getReportAction()));
        const shouldHideReport = !isLoadingReport && (!report?.reportID || !ReportUtils.canAccessReport(report, policies, betas));

        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        if ((isLoadingReport || isLoadingReportAction) && !shouldHideReport) {
            return <FullscreenLoadingIndicator />;
        }

        // Perform the access/not found checks
        // Be sure to avoid showing the not-found page while the parent report actions are still being read from Onyx. The parentReportAction will be undefined while it's being read from Onyx
        // and then reportAction will either be a valid parentReportAction or an empty object. In the case of an empty object, then it's OK to show the not-found page.
        if (shouldHideReport || (parentReportAction !== undefined && isEmptyObject(reportAction))) {
            return <NotFoundPage />;
        }

        return (
            <WrappedComponent
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
                report={report}
                parentReport={parentReport}
                reportMetadata={reportMetadata}
                isLoadingReportData={isLoadingReportData}
                reportActions={reportActions}
                parentReportAction={parentReportAction}
                betas={betas}
                policies={policies}
                ref={ref}
            />
        );
    }

    WithReportOrNotFound.displayName = `withReportOrNotFound(${getComponentDisplayName(WrappedComponent)})`;

    return withWindowDimensions(React.forwardRef(WithReportOrNotFound));
}

export type {WithReportAndReportActionOrNotFoundProps};
