/**
 * Analytics service for A/B testing feedback
 */
export class AnalyticsService {
  constructor(authFetch) {
    this.authFetch = authFetch;
  }

  /**
   * Track user model preference for A/B testing
   * @param {string} messageId - The chat message ID
   * @param {string} selectedModel - 'A' or 'B'
   * @param {Object} modelA - Model A response data
   * @param {Object} modelB - Model B response data
   * @param {string} userQuery - Original user query
   */
  async trackModelPreference(messageId, selectedModel, modelA, modelB, userQuery) {
    try {
      const feedbackData = {
        message_id: messageId,
        selected_model: selectedModel,
        user_query: userQuery,
        model_a: {
          name: modelA.modelName,
          response_time_ms: modelA.responseTimeMs,
          success: modelA.success,
          error: modelA.error,
          content_length: modelA.content?.length || 0
        },
        model_b: {
          name: modelB.modelName,
          response_time_ms: modelB.responseTimeMs,
          success: modelB.success,
          error: modelB.error,
          content_length: modelB.content?.length || 0
        },
        timestamp: new Date().toISOString()
      };

      // Store locally for now (could send to backend later)
      const existingFeedback = JSON.parse(localStorage.getItem('ab_testing_feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('ab_testing_feedback', JSON.stringify(existingFeedback));

      console.log('A/B testing feedback recorded:', feedbackData);
      
      // TODO: Send to backend analytics endpoint when available
      // await this.authFetch.post('/api/analytics/model-preference/', feedbackData);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to track model preference:', error);
      return { success: false, error };
    }
  }

  /**
   * Get A/B testing analytics summary
   */
  getAnalyticsSummary() {
    try {
      const feedback = JSON.parse(localStorage.getItem('ab_testing_feedback') || '[]');
      
      const summary = {
        total_selections: feedback.length,
        model_a_selected: feedback.filter(f => f.selected_model === 'A').length,
        model_b_selected: feedback.filter(f => f.selected_model === 'B').length,
        average_response_time_a: 0,
        average_response_time_b: 0,
        model_a_success_rate: 0,
        model_b_success_rate: 0
      };

      if (feedback.length > 0) {
        const modelAFeedback = feedback.map(f => f.model_a);
        const modelBFeedback = feedback.map(f => f.model_b);

        summary.average_response_time_a = Math.round(
          modelAFeedback.reduce((sum, m) => sum + m.response_time_ms, 0) / modelAFeedback.length
        );
        
        summary.average_response_time_b = Math.round(
          modelBFeedback.reduce((sum, m) => sum + m.response_time_ms, 0) / modelBFeedback.length
        );

        summary.model_a_success_rate = Math.round(
          (modelAFeedback.filter(m => m.success).length / modelAFeedback.length) * 100
        );

        summary.model_b_success_rate = Math.round(
          (modelBFeedback.filter(m => m.success).length / modelBFeedback.length) * 100
        );
      }

      return summary;
    } catch (error) {
      console.error('Failed to get analytics summary:', error);
      return null;
    }
  }
}