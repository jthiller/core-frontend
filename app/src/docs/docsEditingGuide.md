# Docs Editing Guide
**Streamr welcomes all edits and contributions to the Streamr Docs.**

The Streamr Docs are powered with [MDX](https://github.com/mdx-js/mdx). MDX is a format that allows for JSX inside markdown documents. The MDX files can be edited directly and new content can also be contributed to the docs as pure markdown -  ***a Streamr developer will make any necessary polish before merging the PR***.

### Folder organisation
The Docs MDX content files are held in `/src/docs/content`. This content is rendered inside the page components inside `/src/docs/components`.

### Styling
Most of the styling rules can be found in the `DocsLayout` component. All Docs pages inherit from this components and its styles. 

### Headings, Lists & Tables
Headings, lists and tables use the native MD syntax.
H1: Page title
H2: Section title
H3: Nested section title 

### Streamr code snippets
For short inline text code snippets, the native MD implementation is suitable. When working with longer code snippets we use our CodeSnippet component that uses `react-syntax-highlighter` under the hood. It's best to export the code snippets from `/src/docs/code/...` as the raw code can sometimes interfere with the markdown parser. 

```
import CodeSnippet from '$shared/components/CodeSnippet'

<CodeSnippet language='javascript' wrapLines showLineNumbers >{referencedCodeSnippet}</CodeSnippet> 

```

### Images
Images are stored in their respective folders inside `/src/docs/images/...` and are imported like any React asset. 

E.G. 

```
import DataStream from './images/tutorials/data-stream.png'

<div className={docsStyles.centered}>
  <img src={DataStream} />
</div>
```

### In-page navigation
The navigation that powers the sidebar, mobile and page turner controls is found in `/src/docs/components/DocsLayout/Navigation/`. The `ScrollableAnchor` library is used with this to navigate to, and highlight each section on scroll. Each sub navigation section should be wrapped with a ScrollableAnchor. In general, surrounding html/jsx elements with a empty lines helps the MDX parser switch from MD to JSX.

E.G.

```
<ScrollableAnchor id="publish-to-a-stream"><div>

... content ... 

</div></ScrollableAnchor>
```