import { useTransition } from "src/hooks/i18n";
// @flow strict

// import type {Graph, GraphStatus} from 'src/types/chatbot';
// // $FlowFixMe[nonstrict-import]
// import type {SaveInfo} from './editor.jsx';

// import * as React from 'react';
// import {useDispatch, useSelector} from 'react-redux';

// // $FlowFixMe[nonstrict-import]
// import parseISO from 'date-fns/parseISO';

// import {hasLeafQuestion} from './utils';

// import {useHistory, useLocation} from 'src/rerouter';
// import useI18n from 'src/hooks/useI18n';

// import classify from 'src/utils/classify';
// // $FlowFixMe[nonstrict-import]
// import {useReleaseFlag, useChatbotReminders} from 'src/hooks/product-flags';
// // TODO(marcos) move to thunks
// // $FlowFixMe[nonstrict-import]
// import {archiveAndHandleErrors} from './flows.jsx';
// import {handleHideQuestionSuggestion} from './reducer';
// import {textDraftToString} from 'src/utils/draft';

// // $FlowFixMe[untyped-import]
// import {selectQuestionSimilarity} from 'src/selectors/chatbot';

// // $FlowFixMe[nonstrict-import]
// import {copyFlow} from './thunks';

// import HoverIconButton from 'src/components/lib/hover-icon-button';
// // $FlowFixMe[nonstrict-import]
// import {Button} from 'src/components/lib/new-button';
// // $FlowFixMe[nonstrict-import]
// import FormattedTimeDistance from 'src/components/lib/datetime/live-distance.jsx';
// // $FlowFixMe[nonstrict-import]
// import {
//   ContextMenu2,
//   MenuOption,
// } from 'src/components/lib/context-menu/context-menu-2.jsx';
// import {useChatbotStateContext} from './chatbot-state-context';

// // $FlowFixMe[nonstrict-import]
// import {pushSidepanel} from 'src/action-creators/modal';
// // $FlowFixMe[nonstrict-import]
// import Reminders from 'src/components/conversation-builder/conversation-reminders.jsx';
// import FaqConfig from 'src/components/conversation-builder/faq-config.jsx';
// // $FlowFixMe[nonstrict-import]
// import {MouseTip} from '../lib/mouse-tip/mouse-tip.jsx';
// import {Banner} from '@spaced-out/ui-design-system/lib/components/Banner';

// import {Button as GenesisButton} from '@spaced-out/ui-design-system/lib/components/Button';
// import {ButtonDropdown} from '@spaced-out/ui-design-system/lib/components/ButtonDropdown';
// import {Tooltip} from '@spaced-out/ui-design-system/lib/components/Tooltip';

// import Clock from 'src/images/icons/reminders-clock.svg?noAttrs';
// import EditIcon from 'src/images/icons/edit-icon.svg';

// import 'draft-js/dist/Draft.css';
// import flowCss from './flows.css';
// import css from './editor-header.css';

const {useEffect, useState} = React;

type HeaderProps = {
  flow: Graph,
  onDone?: () => mixed,
  onEdit: () => mixed,
  onPreview: (mixed) => mixed,
  onFinalize?: () => mixed,
  onImageExport: () => mixed,
  saveInfo: SaveInfo,
  finalizeDisabled: boolean,
  buildDisabled?: ?boolean,
  isPreviewHidden: boolean,
  isPreviewing: boolean, // can this be deleted? not used here
  isFinalizing: boolean,
  previewsEnabled?: ?boolean,
  exceededLimit?: boolean,
  setFlow: (Graph) => void,
};

export const RemindersTitle = (): React.Node => (
  <>
    <span className={classify(css.remindersTitle)}>{useTransition("REMINDERS", "Reminders")}<Clock className={classify(css.reminderIcon)} />
    </span>
  </>
);

export default function ConversationBuilderHeader({
  flow,
  onDone,
  onEdit,
  onPreview,
  onFinalize,
  saveInfo,
  finalizeDisabled,
  buildDisabled,
  previewsEnabled,
  isPreviewHidden,
  isFinalizing,
  onImageExport,
  exceededLimit,
  setFlow,
}: HeaderProps): React.Node {
  const dispatch = useDispatch();
  const chatbotContext = useChatbotStateContext();
  const {labelI18nInstance} = useI18n();
  const {t} = labelI18nInstance;

    const options = [
    {
      key: 'web',
      label: 'Web',
    },
    {
      key: 'sms',
      label: 'Mobile(SMS)',
    }
  ]

  const router = useHistory();
  const faqEnabled = useReleaseFlag('chatbotFaq');
  const latIntegrationEnabled = useReleaseFlag('enableLiveAgentTransfer');
  const enableQuestionSuggestions =
    useReleaseFlag('chatbotQuestionSuggestions') &&
    flow.bot_type === 'task_oriented' &&
    flow.status === 'init';
  const multiChannelPreviewEnabled =
    useReleaseFlag('chatbotMultiChannelPreview') && !flow.medium;

  const [archiveDisabled, setArchiveDisabled] = React.useState(false);

  const handleOpenReminders = () =>
    router.push(`/conversations/${flow.id}/reminders`);

  const handleOpenFaqSettings = () => {
    dispatch(
      pushSidepanel({
        title: (
          <div className={css.faqHeader}>
            <h5>{useTransition("FLOW_FAQS", "Flow FAQs")}</h5>
          </div>
        ),
        children: <FaqConfig flow={flow} setFlow={setFlow} />,
        direction: 'right',
        width: '33%',
      }),
    );
  };

  const handleOpenLATSettings = () =>
    router.push(`/conversations/${flow.id}/lat-settings`);

  const activeReminders =
    flow.external_config?.reminders?.scheduling_rules.abandoned.enabled ||
    flow.external_config?.reminders?.scheduling_rules.abandoned.email_config
      ?.enabled ||
    flow.external_config?.reminders?.scheduling_rules.never_started.enabled ||
    flow.external_config?.reminders?.scheduling_rules.never_started.email_config
      ?.enabled;

  const remindersEnabled = useChatbotReminders();
  const remindersNavShown =
    remindersEnabled &&
    flow.use_case !== 'sourcing' &&
    (flow.medium === 'sms' || !flow.medium);

  const questionSimilarity = useSelector(selectQuestionSimilarity) ?? {};

  const questionsWithSuggestions = flow.nodes.filter((node) => {
    if (node.type === 'question' && !node.preset_question_id) {
      const questionString = node.text_draft_json
        ? textDraftToString(node.text_draft_json)
        : '';
      return questionSimilarity[questionString]?.length > 0;
    } else {
      return false;
    }
  });
  const showQuestionSuggestionBanner =
    enableQuestionSuggestions &&
    !chatbotContext.state.hideQuestionSuggestions.includes(String(flow.id)) &&
    !!questionsWithSuggestions.length;

  const previewDisabled = hasLeafQuestion(flow);

  return (
    <HeaderContainer>
      <ElevatedHeader>
        <Left>
          <FlowTitle>
            {flow.name}
            <HoverIconButton onClick={onEdit}>
              <EditIcon />
            </HoverIconButton>
          </FlowTitle>
          <FlowSubtitle>{flow.description ?? ''}</FlowSubtitle>
        </Left>
        <Right>
          {remindersNavShown && (
            <div
              className={css.reminderIconContainer}
              onClick={handleOpenReminders}
            >
              <Clock
                className={classify(css.reminderIcon, css.reminderIconButton, {
                  [css.reminderIconButtonDisabled]: !activeReminders,
                })}
              />
              {`${useTransition("REMINDERS", "Reminders")}${activeReminders ? {useTransition("ON", "ON")} : {useTransition("OFF", "OFF")}}`}
            </div>
          )}
          {flow.status === 'init' && exceededLimit && (
            <div className={flowCss.trial}>
              <div className={flowCss.trialVersion}>{useTransition("TRIAL_VERSION", "Trial Version")}</div>
              <div className={flowCss.trialMessage}>{useTransition(
                "REACHED_MAXIMUM_NUMBER_BOTS_YOU_CAN_BUILD_AND_USE.",
                "Reached maximum number bots you can build and use."
              )}</div>
            </div>
          )}

          {multiChannelPreviewEnabled && previewsEnabled && (
            <>
              {
                <Tooltip
                  body={useTransition(
                    "PLEASE_CORRECT_HIGHLIGHTED_ERRORS_BEFORE_PREVIEWING",
                    "Please correct highlighted errors before previewing"
                  )}
                  bodyMaxLines={2}
                  placement="top"
                  hidden={!previewDisabled}
                >
                  <ButtonDropdown
                    type="tertiary"
                    menu={{
                      isFluid: false,
                      menuDisabled: false,
                      options: [
                        {
                          key: 'web',
                          label: 'Web',
                        },
                        {
                          key: 'sms',
                          label: 'Mobile (SMS)',
                        },
                      ],
                      size: 'medium',
                    }}
                    onOptionSelect={(option) => onPreview(option.key)}
                    size="medium"
                    disabled={previewDisabled}
                  >
                    {t('PREVIEW_BOT', 'Preview Bot')}
                  </ButtonDropdown>
                </Tooltip>
              }
            </>
          )}
          {multiChannelPreviewEnabled && flow.status === 'init' && (
            <Tooltip
              body={useTransition(
                "BUILDING_CONVERSATIONS_IS_TEMPORARILY_DISABLED,_PLEASE_CONTACT_YOUR_REPRESENTATIVE_FOR_MORE_DETAILS.",
                "Building conversations is temporarily disabled, please contact your representative for more details."
              )}
              bodyMaxLines={4}
              placement="top"
              hidden={!buildDisabled}
            >
              <GenesisButton
                type="primary"
                onClick={() => {
                  onFinalize?.();
                }}
                disabled={finalizeDisabled}
              >
                {isFinalizing ? {useTransition("STARTING...", "Starting...")} : t('BUILD', 'Build')}
              </GenesisButton>
            </Tooltip>
          )}
          {multiChannelPreviewEnabled &&
            ['building', 'success', 'archived', 'failed'].includes(
              flow.status,
            ) && (
              <GenesisButton onClick={onDone}>
                {t('BACK_TO_FLOW_LIST', 'Back to Flow List')}
              </GenesisButton>
            )}

          {!multiChannelPreviewEnabled && flow.status === 'init' && (
            <>
              <Button onClick={onDone}>{useTransition("DONE", "Done")}</Button>
              <Button
                type="primary"
                onClick={() => {
                  onFinalize?.();
                }}
                disabled={finalizeDisabled}
                title={
                  buildDisabled
                    ? {useTransition(
                    "BUILDING_CONVERSATIONS_IS_TEMPORARILY_DISABLED,_PLEASE_CONTACT_YOUR_REPRESENTATIVE_FOR_MORE_DETAILS.",
                    "Building conversations is temporarily disabled, please contact your representative for more details."
                  )}
                    : undefined
                }
              >
                {isFinalizing ? {useTransition("STARTING...", "Starting...")} : {useTransition("BUILD", "Build")}}
              </Button>
            </>
          )}

          {!multiChannelPreviewEnabled && flow.status === 'success' && (
            <>
              {previewsEnabled && (
                <Button onClick={() => onPreview(flow.medium)}>
                  {!isPreviewHidden
                    ? t('HIDE_PREVIEW', 'Hide Preview')
                    : t('PREVIEW', 'Preview')}
                </Button>
              )}
            </>
          )}
          {!multiChannelPreviewEnabled &&
            ['building', 'success', 'archived', 'failed'].includes(
              flow.status,
            ) && (
              <Button onClick={onDone}>
                {t('BACK_TO_FLOW_LIST', 'Back to Flow List')}
              </Button>
            )}
          <ContextMenu2
            menuContent={
              <>
                <MenuOption
                  onClick={async () => {
                    const newFlow = await dispatch(copyFlow(flow.id));
                    router.push(`/conversations/${newFlow.id}`);
                  }}
                >
                  {flow.status === 'init'
                    ? t('DUPLICATE', 'Duplicate')
                    : t('COPY', 'Copy')}
                </MenuOption>
                {flow.status !== 'archived' && (
                  <MenuOption
                    disabled={archiveDisabled}
                    onClick={async () => {
                      if (archiveDisabled) {
                        return;
                      } else {
                        setArchiveDisabled(true);
                      }
                      try {
                        await dispatch(
                          archiveAndHandleErrors(flow.id, () => {}),
                        );
                      } catch (err) {
                        setArchiveDisabled(false);
                        return;
                      }
                      router.push('/conversations/');
                    }}
                  >
                    {t('ARCHIVE', 'Archive')}
                  </MenuOption>
                )}
                <MenuOption onClick={onImageExport}>
                  {t('EXPORT_TO_PNG', 'Export to .png')}
                </MenuOption>
                {remindersNavShown && (
                  <MenuOption onClick={handleOpenReminders}>
                    {t('MANAGE_REMINDERS', 'Manage Reminders')}
                  </MenuOption>
                )}
                {faqEnabled && (
                  <MenuOption onClick={handleOpenFaqSettings}>
                    {t('MANAGE_FAQ', 'Manage FAQ')}
                  </MenuOption>
                )}
                {latIntegrationEnabled && flow.bot_type === 'task_oriented' && (
                  <MenuOption onClick={handleOpenLATSettings}>
                    {t('MANAGE_LIVE_CHAT', 'Manage Live Chat')}
                  </MenuOption>
                )}
              </>
            }
          />
        </Right>
      </ElevatedHeader>
      {showQuestionSuggestionBanner && (
        <Banner
          dismissable
          onAction={() =>
            handleHideQuestionSuggestion(flow.id, chatbotContext.dispatch)
          }
          onCloseClick={() =>
            handleHideQuestionSuggestion(flow.id, chatbotContext.dispatch)
          }
          semantic="information"
          actionText={useTransition("DISMISS", "Dismiss")}
        >
          {t(
            'ENHANCE_YOUR_CANDIDATES_EXPERIENCE_AND_MAKE_IT_MORE_CONVERSATIONAL_BY_CONVERTING_THE_HIGHLIGHTED_CUSTOM_QUESTIONS_TO_AI_POWERED_PRESET_QUESTIONS',
            `Enhance your candidate's experience and make it more conversational by
          converting the highlighted custom questions to AI powered preset
          questions`,
          )}
        </Banner>
      )}
      <FlowStatus>
        <FlowDetails>
          {flow.status === 'init' && saveInfo.lastTime && (
            <FlowDetail>
              <span>
                {t('AUTOSAVED', 'Autosaved')}{' '}
                <FormattedTimeDistance
                  sinceTime={
                    //$FlowFixMe
                    saveInfo.lastTime
                  }
                />{' '}
                {t('AGO', 'ago')}
              </span>
            </FlowDetail>
          )}
          {flow.status === 'failed' && (
            <FlowDetail>
              <span>
                {t('SUBMITTED_FOR_REVIEW', 'Submitted for review')}{' '}
                {flow.time_failed != null && (
                  <>
                    <FormattedTimeDistance
                      sinceTime={parseISO(flow.time_failed)}
                    />{' '}
                    {t('AGO', 'ago')}
                  </>
                )}
              </span>
            </FlowDetail>
          )}
          {flow.status === 'building' && (
            <FlowDetail>{t('IN_BUILD_QUEUE', 'In build queue')}</FlowDetail>
          )}
          <StatusPill status={flow.status} />
        </FlowDetails>
      </FlowStatus>
    </HeaderContainer>
  );
}

const StatusPill = ({
  status,
  className,
}: {
  status: GraphStatus,
  className?: string,
}) => (
  <Pill className={classify(css[status], className)}>
    {status === 'init'
      ? {useTransition("DRAFT", "Draft")}
      : status === 'building'
      ? {useTransition("BUILDING", "Building")}
      : status === 'failed'
      ? {useTransition("IN_MANUAL_REVIEW", "In manual review")}
      : status === 'success'
      ? {useTransition("READY_FOR_USE", "Ready for use")}
      : status === 'archived'
      ? {useTransition("ARCHIVED", "Archived")}
      : {useTransition("READY", "Ready")}}
  </Pill>
);

export function Pill({
  children,
  className,
  TagName = 'li',
}: {
  children?: ?React.Node,
  className?: string,
  TagName?: string,
}): React.Node {
  return (
    <TagName className={classify(css.statusPill, className)}>
      {children}
    </TagName>
  );
}

const FlowDetail = ({
  className,
  children,
}: {
  className?: string,
  children: React.Node,
}): React.Node => <li className={className}>{children}</li>;

const HeaderContainer = ({children}: {children: React.Node}): React.Node => (
  <div className={css.headerContainer}>{children}</div>
);

const ElevatedHeader = ({children}: {children: React.Node}): React.Node => (
  <div className={css.elevatedHeader}>{children}</div>
);
const FlowStatus = ({children}: {children: React.Node}) => (
  <div className={css.flowStatus}>{children}</div>
);

const FlowTitle = ({children}: {children: React.Node}) => (
  <h2 className={css.flowTitle}>{children}</h2>
);
const FlowSubtitle = ({children}: {children: React.Node}) => (
  <h3 className={css.flowSubtitle}>{children}</h3>
);
const FlowDetails = ({children}: {children: React.Node}): React.Node => (
  <ul className={css.flowDetails}>{children}</ul>
);
const Left = ({children}: {children: React.Node}) => (
  <div className={css.left}>{children}</div>
);
const Right = ({children}: {children: React.Node}) => (
  <div className={css.right}>{children}</div>
);

const HStack = ({
  children,
  className,
}: {
  children: React.Node,
  className?: string,
}) => <div className={classify(css.hstack, className)}>{children}</div>;
const VStack = ({
  children,
  className,
}: {
  children: React.Node,
  className?: string,
}) => <div className={classify(css.vstack, className)}>{children}</div>;
