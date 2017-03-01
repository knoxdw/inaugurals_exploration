This is a freestanding interactive browser visualization of the
distribution of words in each inaugural based on term frequency and
document count as independent dimensions.

The JavaScript dependencies are D3 and lodash, and all the data is
loaded into the browser through tab-separated tables. Because this was
an exploration, more data is loaded now than is used. Ideally this
will be a productively dissatisfying experiment that helps imagine
something better. It would be helpful to see keyword-in-context
snippets for each word, and to offer more contextual information
around each word to enable comparisons of patterns of usage in one
document to other documents in the corpus.

There is not a perfect balance between the data structuring work that
goes on here in various parts of the JavaScript and the modeling
decisions that went into preparing the CSV files. For playing around,
it can be kind of fun working with lodash for data transformations and
D3 for data binding.