// 
strict
import { useI18n } from "src/hooks/useI18n";
import * as React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {SubTitleMedium} from '@spaced-out/ui-design-system/lib/components/Text';
import {useHistory} from 'src/rerouter';
import {EmptyState} from '@spaced-out/ui-design-system/lib/components/EmptyState';
import {Button} from '@spaced-out/ui-design-system/lib/components/Button';
import {
  CollapsibleCard,
  CollapsibleCardAction,
  CollapsibleCardContent,
} from '@spaced-out/ui-design-system/lib/components/CollapsibleCard';
import {
  getRecentlyMessage,
  getLandlineNumbers,
  getInvalidNumbers,
  getBroadcastSuppressionCount,
  getTypesOfBroadcastWarnings,
  getBroadcastSuppressionTimeFrame,
} from 'src/selectors/draft-messages.js';
import {
  getHVBroadcastSuppressionCount,
  getTypesOfHVBroadcastWarnings,
  getAllHVRecentlyMessaged,
  getAllHVLandlineNumbers,
  getAllHVInvalidNumbers,
} from 'src/selectors/hv-broadcasts.js';
import {
  // $FlowFixMe[nonstrict-import]
  setRestoredPhoneNumbersEvent,
  // $FlowFixMe[nonstrict-import]
  setRestoredLandlineNumbersEvent,
} from 'src/action-creators/draft-messages.js';
import {restoreHVBroadcastPhoneNumbers} from 'src/action-creators/hv-broadcasts.js';
import BroadcastList from 'src/components/messaging/broadcast-suppression/broadcast-list.jsx';
import {CARD_TYPES, BROADCAST_SUPPRESSION_TYPE} from './constants';
import {useHVBroadcasts} from 'src/components/messaging/hooks/useHVBroadcasts.js';
import css from './broadcast-suppression.css';
const BroadcastSuppression = (): React.Node => {
  const labelI18nInstance = useI18n();
  const t = labelI18nInstance.t;
  const router = useHistory();
  const {isHVBroadcastLocation} = useHVBroadcasts();
  const closePanel = () => {
    router.replace({
      ...router.location,
      pathname: isHVBroadcastLocation
        ? '/messages/hv-broadcasts/new'
        : '/messages/new',
    });
  };
  const warningsCount = useSelector(
    isHVBroadcastLocation
      ? getHVBroadcastSuppressionCount
      : getBroadcastSuppressionCount,
  );
  const allWarnings = useSelector(
    isHVBroadcastLocation
      ? getTypesOfHVBroadcastWarnings
      : getTypesOfBroadcastWarnings,
  );
  const initialCardName = allWarnings.length > 0 ? allWarnings[0] : '';
  const [cardOpen, setCardOpen] = React.useState(initialCardName);
  return (
    <div className={css.panel}>
      <div className={css.createPanelHeader}>
        <SubTitleMedium color="primary">{`${t("DETECTED_NUMBER", "Detected number")}`}</SubTitleMedium>
        <Button
          ariaLabel={`${t("CLOSE", "close")}`}
          iconRightName="close"
          onClick={closePanel}
          size="small"
          type="ghost"
        />
      </div>
      <div className={css.panelBody}>
        {warningsCount > 0 ? (
          <>
            <RecentlyMessaged cardOpen={cardOpen} setCardOpen={setCardOpen} />
            <LandlineNumbers cardOpen={cardOpen} setCardOpen={setCardOpen} />
            <InvalidNumbers cardOpen={cardOpen} setCardOpen={setCardOpen} />
          </>
        ) : (
          <EmptyState
            description={`${t(
  "NO_NUMBER_HAS_BEEN_EXCLUDED_FROM_THIS_MESSAGE",
  "No number has been excluded from this message"
)}`}
            imageVariant="data"
            title={`${t("IT_IS_EMPTY_HERE", "It is empty here")}`}
          />
        )}
      </div>
    </div>
  );
};
export default BroadcastSuppression;
const RecentlyMessaged = ({cardOpen, setCardOpen}) => {
  const labelI18nInstance = useI18n();
  const t = labelI18nInstance.t;
  const {isHVBroadcastLocation} = useHVBroadcasts();
  const phoneNumbers = useSelector(
    isHVBroadcastLocation ? getAllHVRecentlyMessaged : getRecentlyMessage,
  );
  const [selectedKeys, setSelectedKeys] = React.useState([]);
  const dispatch = useDispatch();
  const entries = phoneNumbers.map((phoneNumber) => {
    return {
      id: phoneNumber.phoneNumber,
      phone: phoneNumber.nationalFormat || phoneNumber.phoneNumber,
      name: phoneNumber.fullName,
    };
  });
  const hasRecentlyMessagedNumbers = phoneNumbers.length > 0;
  const title = `${`${t("RECENTLY_MESSAGED", "Recently Messaged")} (`}${phoneNumbers.length}${`)`}`;
  const router = useHistory();
  const handleOnClick = () => {
    if (isHVBroadcastLocation) {
      router.push('/messages/hv-broadcasts/new/warnings/edit');
    } else {
      router.push('/messages/new/broadcasts/warnings/edit');
    }
  };
  const agent = useSelector((state) =>
    state.accounts.authedUserId
      ? state.accounts.data[state.accounts.authedUserId]
      : null,
  );
  const broadcastConfigType =
    agent.securityRole.configurations.broadcastSuppression.type;
  const broadcastConfig =
    agent.securityRole.configurations.broadcastSuppression;
  const isSelectEnabled =
    broadcastConfigType === BROADCAST_SUPPRESSION_TYPE.RECRUITER;
  const broadcastSuppressionTimeFrame = useSelector(
    getBroadcastSuppressionTimeFrame,
  );
  const timeUnit =
    broadcastSuppressionTimeFrame?.time?.unit || broadcastConfig?.time?.unit;
  const timeNumber =
    broadcastSuppressionTimeFrame?.time?.number ||
    broadcastConfig?.time?.number;
  const genericText = `These numbers have been automatically removed because they were already recently broadcasted by an agency number within ${timeNumber} ${
    timeNumber > 1 ? `${timeUnit}s` : timeUnit
  }. `;
  const toolTipText =
    broadcastConfigType === BROADCAST_SUPPRESSION_TYPE.RECRUITER
      ? genericText +
        'You can add them back by selecting them or pressing the "Edit time frame" button below'
      : genericText + 'Please reach out to your admin to change this setting';
  if (!hasRecentlyMessagedNumbers) {
    return null;
  }
  return hasRecentlyMessagedNumbers && (
    <CollapsibleCard
      headerIconName="message-exclamation"
      onChange={(event, isOpen) => {
        if (isOpen) {
          setCardOpen(CARD_TYPES.RECENTLY_MESSAGED);
        } else {
          setCardOpen('');
        }
      }}
      isOpen={cardOpen === CARD_TYPES.RECENTLY_MESSAGED ? true : false}
      semantic="warning"
      title={title}
    >
      <CollapsibleCardContent>
        <div className={css.collapsibleContent}>
          <BroadcastList
            isSelectEnabled={isSelectEnabled}
            entries={entries}
            selectedKeys={selectedKeys}
            setSelectedKeys={setSelectedKeys}
            toolTipText={toolTipText}
          />
        </div>
      </CollapsibleCardContent>
      {isSelectEnabled && (
        <CollapsibleCardAction>
          <Button
            isFluid
            size="small"
            type="tertiary"
            onClick={handleOnClick}
          >{`${t("EDIT_TIME_FRAME", "Edit time frame")}`}</Button>
          <Button
            isFluid
            size="small"
            type="secondary"
            disabled={selectedKeys.length === 0}
            onClick={() => {
              if (selectedKeys && selectedKeys.length > 0) {
                if (isHVBroadcastLocation) {
                  dispatch(restoreHVBroadcastPhoneNumbers(selectedKeys));
                } else {
                  dispatch(setRestoredPhoneNumbersEvent(selectedKeys));
                }
                setSelectedKeys([]);
              }
            }}
          >{`${t("RESTORE_NUMBER", "Restore number")}`}</Button>
        </CollapsibleCardAction>
      )}
    </CollapsibleCard>
  );
};
const LandlineNumbers = ({cardOpen, setCardOpen}) => {
  const labelI18nInstance = useI18n();
  const t = labelI18nInstance.t;
  const {isHVBroadcastLocation} = useHVBroadcasts();
  const phoneNumbers = useSelector(
    isHVBroadcastLocation ? getAllHVLandlineNumbers : getLandlineNumbers,
  );
  const [selectedKeys, setSelectedKeys] = React.useState([]);
  const dispatch = useDispatch();
  const entries = phoneNumbers.map((phoneNumber) => {
    return {
      id: phoneNumber.phoneNumber,
      phone: phoneNumber.nationalFormat || phoneNumber.phoneNumber,
      name: phoneNumber.fullName,
    };
  });
  const hasLandlineNumbers = phoneNumbers.length > 0;
  const title = `${`${t("LANDLINE_NUMBER", "Landline Number")} (`}${phoneNumbers.length}${`)`}`;

  //   const title = `${$t("LANDLINE_NUMBER", "Landline Number")} (${phoneNumbers.length})`;
  //   const title = `${`(${t("LANDLINE_NUMBER", "Landline Number ")}()`}${phoneNumbers.length}${`())`}`;
  const toolTipText =
    'The following have been detected as landline numbers and unable to receive messages. If you believe that a number has been incorrectly identified as a landline, you can manually add it back.';
  if (!hasLandlineNumbers) {
    return null;
  }
  return hasLandlineNumbers && (
    <CollapsibleCard
      headerIconName="phone-rotary"
      onChange={(event, isOpen) => {
        if (isOpen) {
          setCardOpen(CARD_TYPES.LANDLINE);
        } else {
          setCardOpen('');
        }
      }}
      isOpen={cardOpen === CARD_TYPES.LANDLINE ? true : false}
      semantic="danger"
      title={title}
    >
      <CollapsibleCardContent>
        <div className={css.collapsibleContent}>
          <BroadcastList
            isSelectEnabled={true}
            entries={entries}
            selectedKeys={selectedKeys}
            setSelectedKeys={setSelectedKeys}
            toolTipText={toolTipText}
          />
        </div>
      </CollapsibleCardContent>
      <CollapsibleCardAction>
        <Button
          isFluid
          size="medium"
          type="secondary"
          disabled={selectedKeys.length === 0}
          onClick={() => {
            if (selectedKeys && selectedKeys.length > 0) {
              if (isHVBroadcastLocation) {
                dispatch(restoreHVBroadcastPhoneNumbers(selectedKeys));
              } else {
                Promise.all([
                  dispatch(setRestoredPhoneNumbersEvent(selectedKeys)),
                  dispatch(setRestoredLandlineNumbersEvent(selectedKeys)),
                ]);
              }
              setSelectedKeys([]);
            }
          }}
        >{`${t("RESTORE_NUMBER", "Restore number")}`}</Button>
      </CollapsibleCardAction>
    </CollapsibleCard>
  );
};
const InvalidNumbers = ({cardOpen, setCardOpen}) => {
  const {isHVBroadcastLocation} = useHVBroadcasts();
  const phoneNumbers = useSelector(
    isHVBroadcastLocation ? getAllHVInvalidNumbers : getInvalidNumbers,
  );
  const [selectedKeys, setSelectedKeys] = React.useState([]);
  const entries = phoneNumbers.map((phoneNumber) => {
    return {
      id: phoneNumber.phoneNumber,
      phone: phoneNumber.nationalFormat || phoneNumber.phoneNumber,
      name: phoneNumber.fullName,
    };
  });
  const hasInvalidNumbers = phoneNumbers.length > 0;
  const title = `${`${t("INVALID", "Invalid")} (`}${phoneNumbers.length}${`)`}`;
  const toolTipText = 'These numbers are invalid and cannot receive message.';
  // There will not be isSelectEnabled case in here because invalid numbers don't have any actions
  if (!hasInvalidNumbers) {
    return null;
  }
  return (
    hasInvalidNumbers && (
      <CollapsibleCard
        headerIconName="circle-exclamation"
        onChange={(event, isOpen) => {
          if (isOpen) {
            setCardOpen(CARD_TYPES.INVALID);
          } else {
            setCardOpen('');
          }
        }}
        isOpen={cardOpen === CARD_TYPES.INVALID ? true : false}
        semantic="neutral"
        title={title}
      >
        <CollapsibleCardContent>
          <div className={css.collapsibleContent}>
            <BroadcastList
              isSelectEnabled={false}
              entries={entries}
              selectedKeys={selectedKeys}
              setSelectedKeys={setSelectedKeys}
              toolTipText={toolTipText}
            />
          </div>
        </CollapsibleCardContent>
      </CollapsibleCard>
    )
  );
};