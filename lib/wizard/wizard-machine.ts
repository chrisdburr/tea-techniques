import type { Technique } from '@/lib/types';
import { wizardConfig } from './config';
import type { WizardQuestion, WizardState } from './types';

export class WizardStateMachine {
  private state: WizardState;
  private allTechniques: Technique[];
  private filteredTechniques: Technique[];

  constructor(techniques: Technique[]) {
    this.allTechniques = techniques;
    this.filteredTechniques = techniques;
    this.state = this.createInitialState();
  }

  private createInitialState(): WizardState {
    return {
      currentFlow: '',
      currentQuestionIndex: -1,
      answers: {},
      path: [],
      remainingTechniques: this.allTechniques.length,
      skippedQuestions: [],
    };
  }

  // Initialize wizard with selected entry point
  startFlow(flowId: string) {
    const flow = wizardConfig.flows[flowId];
    if (!flow) {
      throw new Error(`Invalid flow ID: ${flowId}`);
    }

    this.state = {
      ...this.createInitialState(),
      currentFlow: flowId,
      currentQuestionIndex: 0,
    };

    return this.getCurrentQuestion();
  }

  // Get current question based on state
  getCurrentQuestion(): WizardQuestion | null {
    const flow = wizardConfig.flows[this.state.currentFlow];
    if (!flow) {
      return null;
    }

    const questionIds = flow.questions;
    let questionIndex = this.state.currentQuestionIndex;

    // Skip conditional questions if needed
    while (questionIndex < questionIds.length) {
      const questionId = questionIds[questionIndex];
      const question = wizardConfig.questions[questionId];

      if (!question) {
        questionIndex++;
        continue;
      }

      // Check if question should be skipped
      if (this.shouldSkipQuestion(question)) {
        this.state.skippedQuestions.push(questionId);
        questionIndex++;
        continue;
      }

      this.state.currentQuestionIndex = questionIndex;
      return question;
    }

    return null; // No more questions
  }

  // Check if a question should be skipped based on current state
  private shouldSkipQuestion(question: WizardQuestion): boolean {
    // Skip conditional questions that don't meet conditions
    if (question.conditional) {
      // Check if there are enough options to display
      if (question.minOptionsForDisplay) {
        const availableOptions = this.getAvailableOptionsCount(question);
        if (availableOptions < question.minOptionsForDisplay) {
          return true;
        }
      }

      // Skip if results are already uniform (for skipIfUniform)
      if (question.skipIfUniform && this.checkUniformity(question)) {
        return true;
      }
    }

    // Skip if we already have ideal number of results
    if (
      this.filteredTechniques.length <= wizardConfig.resultsConfig.idealResults
    ) {
      return true;
    }

    return false;
  }

  // Get count of available options for a question
  private getAvailableOptionsCount(question: WizardQuestion): number {
    if (!question.filterTag) {
      return 0;
    }

    const uniqueValues = new Set<string>();
    for (const technique of this.filteredTechniques) {
      const values = this.getTechniqueValues(technique, question.filterTag);
      for (const value of values) {
        uniqueValues.add(value);
      }
    }

    return uniqueValues.size;
  }

  // Check if all remaining techniques have same value for a filter
  private checkUniformity(question: WizardQuestion): boolean {
    if (!question.filterTag || this.filteredTechniques.length === 0) {
      return false;
    }

    const firstTechniqueValues = this.getTechniqueValues(
      this.filteredTechniques[0],
      question.filterTag
    );

    return this.filteredTechniques.every((technique) => {
      const values = this.getTechniqueValues(technique, question.filterTag);
      return (
        values.length === firstTechniqueValues.length &&
        values.every((v) => firstTechniqueValues.includes(v))
      );
    });
  }

  // Get values from technique for a specific filter tag
  private getTechniqueValues(
    technique: Technique,
    filterTag: string
  ): string[] {
    switch (filterTag) {
      case 'assurance_goals':
        return technique.assurance_goals || [];
      case 'applicable-models':
      case 'lifecycle-stage':
      case 'technique-type':
      case 'expertise-needed':
      case 'data-requirements':
        return technique.tags
          ? technique.tags.filter((tag) => tag.startsWith(`${filterTag}/`))
          : [];
      case 'assurance-goal-category': {
        // For assurance-goal-category, we need to check tags that start with the category
        // and are related to the previously selected assurance goal
        if (!technique.tags) {
          return [];
        }
        const previousGoal = this.state.answers['assurance-goal'];
        if (!previousGoal || typeof previousGoal !== 'string') {
          return technique.tags.filter((tag) =>
            tag.startsWith(`${filterTag}/`)
          );
        }
        // Filter tags that match the pattern: assurance-goal-category/{goal}/...
        const goalLower = previousGoal.toLowerCase();
        return technique.tags.filter((tag) =>
          tag.startsWith(`${filterTag}/${goalLower}/`)
        );
      }
      default:
        return [];
    }
  }

  // Submit answer and move to next question
  submitAnswer(answer: string | string[]) {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      return null;
    }

    // Store answer
    this.state.answers[currentQuestion.id] = answer;
    this.state.path.push({
      question: currentQuestion.id,
      answer,
    });

    // Apply filtering based on answer
    if (currentQuestion.filterTag && !this.isNotSureAnswer(answer)) {
      this.applyFilter(currentQuestion.filterTag, answer);
    }

    // Move to next question
    this.state.currentQuestionIndex++;
    return this.getCurrentQuestion();
  }

  // Check if answer is "not sure" type
  private isNotSureAnswer(answer: string | string[]): boolean {
    if (Array.isArray(answer)) {
      return answer.includes('not-sure') || answer.length === 0;
    }
    return answer === 'not-sure' || answer === 'agnostic';
  }

  // Apply filter to techniques based on answer
  private applyFilter(filterTag: string, answer: string | string[]) {
    const answers = Array.isArray(answer) ? answer : [answer];

    // Special handling for assurance-goal-category
    if (filterTag === 'assurance-goal-category') {
      const previousGoal = this.state.answers['assurance-goal'];
      if (previousGoal && typeof previousGoal === 'string') {
        const goalLower = previousGoal.toLowerCase();
        // Convert answer to full tag path
        const fullAnswers = answers.map((ans) => {
          // If answer already contains the goal, use as-is
          if (ans.includes('/')) {
            return ans;
          }
          // Otherwise, construct the full path
          return `${filterTag}/${goalLower}/${ans}`;
        });

        this.filteredTechniques = this.filteredTechniques.filter(
          (technique) => {
            const values = this.getTechniqueValues(technique, filterTag);
            // Check if technique has any of the selected subcategory tags
            return fullAnswers.some((fullAnswer) =>
              values.some((value) => value.startsWith(fullAnswer))
            );
          }
        );
        return;
      }
    }

    this.filteredTechniques = this.filteredTechniques.filter((technique) => {
      const techniqueValues = this.getTechniqueValues(technique, filterTag);

      // For assurance goals, check direct match
      if (filterTag === 'assurance_goals') {
        return answers.some((ans) => technique.assurance_goals?.includes(ans));
      }

      // For tags, check if technique has any of the selected values
      if (answers.includes('agnostic')) {
        // If "not sure" or "agnostic", include techniques without specific requirements
        return (
          techniqueValues.length === 0 ||
          techniqueValues.some((tag) => tag.includes('agnostic'))
        );
      }

      // Check if technique matches any of the selected answers
      return answers.some((ans) =>
        techniqueValues.some((tag) => {
          const tagValue = tag.split('/').pop();
          return tagValue === ans || tag.endsWith(`/${ans}`);
        })
      );
    });

    this.state.remainingTechniques = this.filteredTechniques.length;
  }

  // Go back to previous question
  goBack(): WizardQuestion | null {
    if (this.state.currentQuestionIndex <= 0) {
      return null;
    }

    // Remove last answer
    if (this.state.path.length > 0) {
      const lastPath = this.state.path.pop();
      if (lastPath) {
        delete this.state.answers[lastPath.question];
      }
    }

    // Reset filtered techniques by re-applying all filters except the last one
    this.filteredTechniques = this.allTechniques;
    for (const pathItem of this.state.path) {
      const question = wizardConfig.questions[pathItem.question];
      if (question?.filterTag && !this.isNotSureAnswer(pathItem.answer)) {
        this.applyFilter(question.filterTag, pathItem.answer);
      }
    }

    // Move back
    this.state.currentQuestionIndex--;
    this.state.remainingTechniques = this.filteredTechniques.length;

    return this.getCurrentQuestion();
  }

  // Reset wizard to initial state
  reset() {
    this.state = this.createInitialState();
    this.filteredTechniques = this.allTechniques;
  }

  // Get current state
  getState(): WizardState {
    return { ...this.state };
  }

  // Get filtered techniques
  getFilteredTechniques(): Technique[] {
    return [...this.filteredTechniques];
  }

  // Check if should show results
  shouldShowResults(): boolean {
    return (
      this.getCurrentQuestion() === null ||
      this.filteredTechniques.length <= wizardConfig.resultsConfig.maxResults
    );
  }

  // Get progress percentage
  getProgress(): number {
    const flow = wizardConfig.flows[this.state.currentFlow];
    if (!flow) {
      return 0;
    }

    // Calculate based on actual questions that will be shown
    const totalQuestions = flow.questions.length;
    const answeredQuestions = this.state.path.length;

    // If we've reached the end (no more questions or should show results)
    if (this.shouldShowResults() || this.getCurrentQuestion() === null) {
      return 100;
    }

    // Calculate based on minimum between answered questions and total
    // This ensures we reach 100% even when questions are skipped
    const effectiveTotal = Math.max(
      totalQuestions - this.state.skippedQuestions.length,
      1
    );
    const progress = Math.min((answeredQuestions / effectiveTotal) * 100, 95);

    return Math.round(progress);
  }
}
