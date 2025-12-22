# Test Markdown Document

This is a test markdown file for testing the markdown renderer plugin.

## Headers

### Level 3 Header

#### Level 4 Header

##### Level 5 Header

## Text Formatting

This is **bold text** and this is *italic text*.

This is ***bold and italic*** text.

This is ~~strikethrough~~ text.

## Links

[External Link](https://example.com)

[Internal Link](#headers)

## Lists

### Unordered List

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

### Ordered List

1. First item
2. Second item
3. Third item

### Task List

- [x] Completed task
- [ ] Incomplete task
- [ ] Another task

## Code

Inline `code` example.

```javascript
// Code block
function hello(world) {
  console.log(`Hello, ${world}!`);
  return true;
}
```

```python
# Python example
def greet(name):
    return f"Hello, {name}!"
```

## Blockquotes

> This is a blockquote.
> It can span multiple lines.

> Nested blockquote
>> With nesting

## Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

## Horizontal Rule

---

## Images

![Alt text](https://via.placeholder.com/150 "Image title")

## Citations

According to Smith et al. (2023), this is a citation example.[^1]

[^1]: Smith, J. et al. (2023). "Test Citation". Journal of Testing, 1(1), 1-10.
