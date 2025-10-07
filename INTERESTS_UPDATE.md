# Interests Selection - Updated Implementation

## Overview
The Interests screen has been updated to dynamically fetch interest categories from the backend and save user selections to their profile.

---

## What Changed

### Previous Implementation (Static)
- Hardcoded interest categories in the component
- No API integration
- Selections were not saved to backend
- Navigation to Home without persisting data

### New Implementation (Dynamic)
- Fetches interest categories from backend API
- Saves selected interests to user profile
- Loading states with skeleton UI
- Error handling for API failures
- Interests persist across sessions

---

## API Integration

### 1. Fetch Interest Categories

**Endpoint:**
```
GET /app-data/inspiration-categories
```

**Request:**
No request body required. This is a GET request.

**Success Response:**
```json
{
  "data": {
    "stylesInspo": [
      {
        "id": "braids-twists",
        "emoji": "👩🏿‍🦱",
        "title": "Braids & Twists"
      },
      {
        "id": "wig-installs",
        "emoji": "👩🏿‍🦲",
        "title": "Wig Installs & Sew-ins"
      }
      // ... more items
    ],
    "touchupsTransformations": [
      {
        "id": "skincare-aesthetic",
        "emoji": "💉",
        "title": "Skincare & Aesthetic Treatments"
      },
      {
        "id": "massage",
        "emoji": "🧘‍♀️",
        "title": "Massage"
      }
      // ... more items
    ]
  }
}
```

**Interface:**
```typescript
interface InspirationCategory {
  id: string;
  emoji: string;
  title: string;
}

interface InspirationCategoriesResponse {
  data: {
    stylesInspo: InspirationCategory[];
    touchupsTransformations: InspirationCategory[];
  };
}
```

**Usage in Component:**
```typescript
const {
  data: categoriesData,
  isLoading,
  isError,
} = useGetInspirationCategoriesQuery();

const stylesInspo = categoriesData?.data?.stylesInspo || [];
const touchupsTransformations = categoriesData?.data?.touchupsTransformations || [];
```

---

### 2. Save User Interests

**Endpoint:**
```
PATCH /users/profile
```

**Request Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "interests": ["braids-twists", "makeup-looks", "haircuts"]
}
```

**Success Response:**
```json
{
  "data": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "interests": ["braids-twists", "makeup-looks", "haircuts"],
      // ... other user fields
    }
  }
}
```

**Usage in Component:**
```typescript
const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();

const handleSave = async () => {
  try {
    await updateProfile({
      interests: selectedInterests
    }).unwrap();

    navigation.navigate("Home");
  } catch (error: any) {
    showToast({
      message: error?.data?.message || 'Failed to save interests. Please try again.',
      type: 'error'
    });
  }
};
```

---

## UI States

### 1. Loading State
When `isLoading === true`, display skeleton placeholders:

```typescript
const renderSkeletonSection = (title: string, itemCount: number) => (
  <View style={styles.section}>
    <Text weight="medium" style={styles.sectionTitle}>
      {title}
    </Text>
    <View style={styles.interestsContainer}>
      {Array.from({ length: itemCount }, (_, index) => (
        <View key={index} style={styles.skeletonInterestItem}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width={Math.random() * 60 + 80} height={14} borderRadius={4} />
        </View>
      ))}
    </View>
  </View>
);
```

**Display:**
- Shows 9 skeleton items per section
- Randomized width for title skeletons (80-140px)
- Light gray background matching interest item style

---

### 2. Error State
When `isError === true`, display error message:

```typescript
<View style={styles.errorContainer}>
  <Text weight="medium" style={styles.errorText}>
    Failed to load categories. Please check your connection and try again.
  </Text>
</View>
```

**Style:**
- Red error text color
- Centered in container
- Minimum height of 200px

---

### 3. Success State
When data loads successfully, render dynamic interest items:

```typescript
{renderInterestSection("Styles, slays & inspo you love", stylesInspo)}
{renderInterestSection("From touch-ups to transformations", touchupsTransformations)}
```

---

## Validation & Error Handling

### Client-Side Validation

**Before Save:**
```typescript
if (selectedInterests.length === 0) {
  showToast({
    message: 'Please select at least one interest',
    type: 'error'
  });
  return;
}
```

**Button State:**
```typescript
<Button
  title="Save"
  onPress={handleSave}
  disabled={selectedInterests.length === 0 || isUpdatingProfile}
  loading={isUpdatingProfile}
/>
```

### API Error Handling

**Save Interests Error:**
```typescript
catch (error: any) {
  showToast({
    message: error?.data?.message || 'Failed to save interests. Please try again.',
    type: 'error'
  });
}
```

**Fetch Categories Error:**
- Displays inline error message
- Allows user to retry by navigating back/forward
- Consider adding a "Retry" button in future iteration

---

## Navigation Flow Update

### Social Auth Flow
After social authentication, if user profile is complete but interests are missing:

```typescript
// In socialAuths/index.tsx
if (user.activeRole === ActiveRole.CUSTOMER) {
  if (!user.interests || user.interests.length === 0) {
    navigation.navigate('Interests');
  } else {
    navigation.navigate('Home');
  }
}
```

This ensures returning users who haven't set interests are prompted to complete this step.

---

## Web Implementation Guide

### Step-by-Step for Web Version

#### 1. Create API Service

```typescript
// services/appDataApi.ts or similar

export const getInspirationCategories = async () => {
  const response = await fetch(`${API_BASE}/app-data/inspiration-categories`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
};
```

#### 2. Create Interests Component

```typescript
// pages/signup/Interests.tsx

const Interests = () => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [categories, setCategories] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await getInspirationCategories();
      setCategories(data.data);
    } catch (error) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedInterests.length === 0) {
      showToast('Please select at least one interest', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({ interests: selectedInterests });
      navigate('/home');
    } catch (error) {
      showToast('Failed to save interests', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (isError) {
    return (
      <ErrorMessage>
        Failed to load categories. Please check your connection and try again.
      </ErrorMessage>
    );
  }

  return (
    <div>
      <Header>What are you into?</Header>
      <Subheading>
        Select what you love so we can match you with inspirations and services that fit your vibe
      </Subheading>

      <Section title="Styles, slays & inspo you love">
        {categories.stylesInspo.map(interest => (
          <InterestChip
            key={interest.id}
            emoji={interest.emoji}
            title={interest.title}
            selected={selectedInterests.includes(interest.id)}
            onClick={() => toggleInterest(interest.id)}
          />
        ))}
      </Section>

      <Section title="From touch-ups to transformations">
        {categories.touchupsTransformations.map(interest => (
          <InterestChip
            key={interest.id}
            emoji={interest.emoji}
            title={interest.title}
            selected={selectedInterests.includes(interest.id)}
            onClick={() => toggleInterest(interest.id)}
          />
        ))}
      </Section>

      <Button
        onClick={handleSave}
        disabled={selectedInterests.length === 0 || isSaving}
        loading={isSaving}
      >
        Save
      </Button>
    </div>
  );
};
```

#### 3. Create Interest Chip Component

```tsx
interface InterestChipProps {
  emoji: string;
  title: string;
  selected: boolean;
  onClick: () => void;
}

const InterestChip: React.FC<InterestChipProps> = ({
  emoji,
  title,
  selected,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`interest-chip ${selected ? 'selected' : ''}`}
    >
      <span className="emoji">{emoji}</span>
      <span className="title">{title}</span>
    </button>
  );
};
```

#### 4. CSS Styling

```css
.interest-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  margin: 4px;
  border-radius: 20px;
  border: none;
  background-color: #F0F0F0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.interest-chip.selected {
  background-color: #E3F2FD; /* Light blue or your secondary light color */
}

.interest-chip .emoji {
  margin-right: 8px;
  font-size: 16px;
}

.interest-chip .title {
  font-size: 14px;
  font-weight: 500;
}

.interest-chip:hover {
  opacity: 0.8;
}
```

#### 5. Skeleton Loader Component

```tsx
const SkeletonLoader = () => {
  return (
    <div>
      <SkeletonSection title="Styles, slays & inspo you love" count={9} />
      <SkeletonSection title="From touch-ups to transformations" count={9} />
    </div>
  );
};

const SkeletonSection = ({ title, count }) => (
  <div>
    <h3>{title}</h3>
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-chip">
          <div className="skeleton-emoji" />
          <div className="skeleton-title" style={{ width: `${Math.random() * 60 + 80}px` }} />
        </div>
      ))}
    </div>
  </div>
);
```

---

## Testing Checklist

- [ ] Categories load from API on mount
- [ ] Loading skeleton displays while fetching
- [ ] Error message displays if API fails
- [ ] Interest items render with correct emoji and title
- [ ] Clicking interest toggles selection state
- [ ] Multiple interests can be selected
- [ ] Background color changes when selected
- [ ] Save button disabled when no interests selected
- [ ] Save button disabled while saving (loading state)
- [ ] Validation error shown if trying to save with none selected
- [ ] Successfully saves interests to backend
- [ ] Navigates to Home after successful save
- [ ] Error toast shown if save fails
- [ ] Social auth users redirected to Interests if interests empty

---

## Key Differences from Previous Version

| Aspect | Old (Static) | New (Dynamic) |
|--------|-------------|---------------|
| **Data Source** | Hardcoded in component | Fetched from API |
| **Categories** | Fixed 18 items | Variable (backend controlled) |
| **Saving** | No backend save | Saves to user profile |
| **Loading State** | None | Skeleton UI |
| **Error Handling** | None | Error message + toast |
| **Validation** | Client-side only | Client + server validation |
| **User Experience** | Immediate display | Progressive loading |

---

## Benefits of New Approach

1. **Backend Control**: Categories can be updated without app release
2. **Personalization**: Interests persist and can power recommendations
3. **Better UX**: Loading states prevent confusion
4. **Error Resilience**: Graceful handling of network issues
5. **Analytics**: Can track which interests are most popular
6. **Future-Proof**: Easy to add/remove categories dynamically

---

## Future Enhancements

### Potential Improvements:

1. **Retry Button**: Add retry button in error state instead of requiring navigation
2. **Search/Filter**: Allow users to search interests if list grows
3. **Recommendations**: Show "Popular" or "Recommended for you" badges
4. **Skip Option**: Allow users to skip and set interests later
5. **Edit Interests**: Allow editing from profile settings
6. **Min/Max Selection**: Enforce minimum or maximum selections
7. **Category Descriptions**: Add tooltips explaining each interest
8. **Images**: Replace emojis with actual images for better visuals

---

## Summary

The Interests screen now provides a complete, production-ready experience:

- ✅ Fetches dynamic categories from backend
- ✅ Saves user selections to profile
- ✅ Handles loading and error states
- ✅ Validates user input
- ✅ Integrates with navigation flow
- ✅ Provides smooth UX with skeletons and loading indicators

This update makes the interests feature fully functional and maintainable, allowing the backend team to manage categories without requiring app updates.
