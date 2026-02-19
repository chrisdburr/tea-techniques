import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Technique } from '@/lib/types';
import type { WizardQuestion, WizardState } from '@/lib/wizard/types';
import { WizardStateMachine } from '@/lib/wizard/wizard-machine';

interface UseWizardOptions {
  techniques: Technique[];
  animationDelay?: number;
}

interface WizardHookState {
  currentQuestion: WizardQuestion | null;
  currentFlow: string;
  progress: number;
  filteredTechniques: Technique[];
  showResults: boolean;
  machineState: WizardState;
  isTransitioning: boolean;
  direction: 'forward' | 'backward';
}

type WizardAction =
  | {
      type: 'START_TRANSITION';
      direction: 'forward' | 'backward';
      currentFlow?: string;
    }
  | {
      type: 'SYNC';
      payload: Omit<WizardHookState, 'isTransitioning' | 'direction'>;
    }
  | { type: 'RESET' };

const defaultMachineState: WizardState = {
  currentFlow: '',
  currentQuestionIndex: -1,
  answers: {},
  path: [],
  remainingTechniques: 0,
  skippedQuestions: [],
};

const initialState: WizardHookState = {
  currentQuestion: null,
  currentFlow: '',
  progress: 0,
  filteredTechniques: [],
  showResults: false,
  machineState: defaultMachineState,
  isTransitioning: false,
  direction: 'forward',
};

function wizardReducer(
  state: WizardHookState,
  action: WizardAction
): WizardHookState {
  switch (action.type) {
    case 'START_TRANSITION':
      return {
        ...state,
        isTransitioning: true,
        direction: action.direction,
        ...(action.currentFlow !== undefined
          ? { currentFlow: action.currentFlow }
          : {}),
      };
    case 'SYNC':
      return {
        ...state,
        ...action.payload,
        isTransitioning: false,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useWizard({
  techniques,
  animationDelay = 0,
}: UseWizardOptions) {
  const machineRef = useRef(new WizardStateMachine(techniques));
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  // Recreate machine when techniques change
  useEffect(() => {
    if (techniques.length > 0) {
      machineRef.current = new WizardStateMachine(techniques);
      dispatch({ type: 'RESET' });
    }
  }, [techniques]);

  const syncState = useCallback(
    (
      overrides?: Partial<
        Pick<WizardHookState, 'showResults' | 'currentFlow' | 'currentQuestion'>
      >
    ) => {
      const machine = machineRef.current;
      const ms = machine.getState();
      dispatch({
        type: 'SYNC',
        payload: {
          currentQuestion:
            overrides?.currentQuestion !== undefined
              ? overrides.currentQuestion
              : machine.getCurrentQuestion(),
          currentFlow:
            overrides?.currentFlow !== undefined
              ? overrides.currentFlow
              : ms.currentFlow,
          progress: machine.getProgress(),
          filteredTechniques: machine.getFilteredTechniques(),
          showResults: overrides?.showResults ?? false,
          machineState: ms,
        },
      });
    },
    []
  );

  const transition = useCallback(
    (
      direction: 'forward' | 'backward',
      action: () => void,
      immediateFlow?: string
    ) => {
      if (animationDelay > 0) {
        dispatch({
          type: 'START_TRANSITION',
          direction,
          currentFlow: immediateFlow,
        });
        setTimeout(action, animationDelay);
      } else {
        action();
      }
    },
    [animationDelay]
  );

  const startFlow = useCallback(
    (flowId: string) => {
      transition(
        'forward',
        () => {
          machineRef.current.startFlow(flowId);
          syncState();
        },
        flowId
      );
    },
    [transition, syncState]
  );

  const submitAnswer = useCallback(
    (answer: string | string[]) => {
      transition('forward', () => {
        const machine = machineRef.current;
        const nextQuestion = machine.submitAnswer(answer);
        syncState({
          showResults: !nextQuestion || machine.shouldShowResults(),
        });
      });
    },
    [transition, syncState]
  );

  const goBack = useCallback(() => {
    transition('backward', () => {
      const previousQuestion = machineRef.current.goBack();
      if (previousQuestion) {
        syncState();
      } else {
        syncState({ currentFlow: '', currentQuestion: null });
      }
    });
  }, [transition, syncState]);

  const restart = useCallback(() => {
    transition('forward', () => {
      machineRef.current.reset();
      dispatch({ type: 'RESET' });
    });
  }, [transition]);

  const reset = useCallback(() => {
    machineRef.current.reset();
    dispatch({ type: 'RESET' });
  }, []);

  return {
    ...state,
    startFlow,
    submitAnswer,
    goBack,
    restart,
    reset,
  };
}
