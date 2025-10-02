import { Question, QuestionType } from '../../types';

interface QuestionEditorProps {
  question: Omit<Question, 'questionId' | 'revealed'>;
  onChange: (question: Omit<Question, 'questionId' | 'revealed'>) => void;
}

export default function QuestionEditor({ question, onChange }: QuestionEditorProps) {
  const updateField = (field: string, value: any) => {
    onChange({ ...question, [field]: value });
  };

  const updateOption = (index: number, field: string, value: string) => {
    if (!question.options) return;
    const newOptions = [...question.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange({ ...question, options: newOptions });
  };

  const addOption = () => {
    if (!question.options) return;
    const newId = (question.options.length + 1).toString();
    const newOptions = [...question.options, { id: newId, text: '', imageUrl: '' }];
    onChange({ ...question, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (!question.options || question.options.length <= 2) return;
    const newOptions = question.options.filter((_, i) => i !== index);
    onChange({ ...question, options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type
          </label>
          <select
            value={question.type}
            onChange={(e) => updateField('type', e.target.value as QuestionType)}
            className="input-field"
          >
            <option value="MC">Multiple Choice</option>
            <option value="TF">True/False</option>
            <option value="NUM">Numeric</option>
            <option value="POLL">Poll (No correct answer)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (sec)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={question.timeLimitSec}
              onChange={(e) => updateField('timeLimitSec', parseInt(e.target.value))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Points
            </label>
            <input
              type="number"
              min="0"
              max="1000"
              step="10"
              value={question.pointsBase}
              onChange={(e) => updateField('pointsBase', parseInt(e.target.value))}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Text
        </label>
        <textarea
          value={question.text}
          onChange={(e) => updateField('text', e.target.value)}
          placeholder="Enter your question here..."
          className="input-field"
          rows={2}
          required
        />
      </div>

      {question.type === 'TF' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correct Answer
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="true"
                checked={question.correctOptionId === 'true'}
                onChange={(e) => updateField('correctOptionId', e.target.value)}
                className="mr-2"
              />
              True
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="false"
                checked={question.correctOptionId === 'false'}
                onChange={(e) => updateField('correctOptionId', e.target.value)}
                className="mr-2"
              />
              False
            </label>
          </div>
        </div>
      )}

      {(question.type === 'MC' || question.type === 'POLL') && question.options && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Options
            </label>
            {question.options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Add Option
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <div key={option.id} className="flex gap-2 items-center">
                {question.type !== 'POLL' && (
                  <input
                    type="radio"
                    name={`correct-${question.index}`}
                    checked={question.correctOptionId === option.id}
                    onChange={() => updateField('correctOptionId', option.id)}
                  />
                )}
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(index, 'text', e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="input-field flex-1"
                />
                {question.options!.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {question.type === 'NUM' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Value
            </label>
            <input
              type="number"
              step="any"
              value={question.numRule?.exactValue || ''}
              onChange={(e) => updateField('numRule', { 
                exactValue: parseFloat(e.target.value),
                tolerance: question.numRule?.tolerance || 0
              })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tolerance (+/-)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={question.numRule?.tolerance || 0}
              onChange={(e) => updateField('numRule', {
                exactValue: question.numRule?.exactValue || 0,
                tolerance: parseFloat(e.target.value)
              })}
              className="input-field"
            />
          </div>
        </div>
      )}
    </div>
  );
}
