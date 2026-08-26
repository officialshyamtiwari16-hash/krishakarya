import React, { useState } from 'react';
import { Star, X, CheckCircle2, MessageSquare, AlertCircle, ThumbsUp } from 'lucide-react';
import { sanitizeString, isValidRating } from '../lib/validation';
import { rateLimiter } from '../lib/rateLimit';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  type: 'sahyogi' | 'machinery';
  onSubmitReview: (targetId: string, rating: number, comment: string) => void;
  currentUserName?: string;
}

const QUICK_TAGS = {
  sahyogi: [
    '🌾 Hardworking & Punctual',
    '🚜 Expert Machine Operator',
    '💧 Efficient Field Work',
    '🤝 Very Cooperative',
    '💰 Fair Wage Expectations',
    '🌱 Careful Crop Handling',
  ],
  machinery: [
    '🚜 Well-Maintained & Powerful',
    '⛽ High Fuel Efficiency',
    '⏰ Timely Delivery',
    '🌾 Excellent Harvest Output',
    '🔧 Clean Implements',
    '👨‍🌾 Skilled Operator Included',
  ],
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetName,
  type,
  onSubmitReview,
  currentUserName = 'Farmer',
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidRating(rating)) {
      setError('Please choose a rating between 1 and 5 stars.');
      return;
    }

    const limit = rateLimiter.checkLimit('review_submit');
    if (!limit.allowed) {
      setError(`Please wait ${limit.remainingCooldownSec} seconds before submitting another review.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const tagText = selectedTags.length > 0 ? ` [${selectedTags.join(', ')}]` : '';
    const finalComment = sanitizeString(comment + tagText, 500);

    setTimeout(() => {
      onSubmitReview(targetId, rating, finalComment || 'Great service and communication!');
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  const tags = QUICK_TAGS[type];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 border border-emerald-500/20 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-modalPop"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
              <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
            </div>
            <div>
              <h3 id="review-modal-title" className="text-base font-black text-slate-900">
                Rate & Review (रेटिंग और समीक्षा)
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                {type === 'sahyogi' ? 'Sahyogi: ' : 'Machinery: '}
                <strong className="text-slate-800">{targetName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close review modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Selector */}
          <div className="flex flex-col items-center justify-center py-2 space-y-1.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-700">Choose Overall Rating</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} star rating`}
                    className="p-1.5 hover:scale-115 transition-transform cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-xl"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        isFilled
                          ? 'text-amber-500 fill-amber-400 drop-shadow-xs'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-extrabold text-amber-700">
              {rating === 5 && '🌟 Outstanding (बहुत बढ़िया)'}
              {rating === 4 && '👍 Very Good (अच्छा काम)'}
              {rating === 3 && '🌾 Satisfactory (संतोषजनक)'}
              {rating === 2 && '⚠️ Needs Improvement (सुधार आवश्यक)'}
              {rating === 1 && '❌ Unsatisfactory (खराब अनुभव)'}
            </span>
          </div>

          {/* Quick Experience Tags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Highlight Key Strengths (प्रमुख विशेषताएं)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[36px] flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Comment Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Your Review & Experience (समीक्षा व टिप्पणी)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share work punctuality, equipment maintenance, fair pricing, or recommendations for other farmers..."
              className="w-full p-3 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer min-h-[44px] flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting...' : 'Submit Review (समीक्षा जमा करें)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
