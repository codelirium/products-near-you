Products Near You
=================

The purpose of this exercise is to build an API that returns the most popular products
from shops near you.

Provided goodies
----------------

1. A server boilerplate using `Flask`. To run the server:

  ```
  $ python runserver.py
  ```

2. A rudimentary client so you can visualize the results more easily. The client does not
have any way to communicate with the API so you will need to implement that. To run the
client:

  ```
  $ cd client
  $ python -m SimpleHTTPServer
  ```

3. Four datasets in CSV format:
    * `shops.csv`: shops with their coordinates
    * `products.csv`: products per shop along available quantity and global popularity
    * `tags.csv`: a bunch of tags
    * `taggings.csv`: what tags each shop has

What you need to do
-------------------

1. Create a Python virtualenv and install the requirements:

    ```
    $ pip install virtualenvwrapper
    $ mkvirtualenv
    $ pip install -r requirements.txt
    ```

2. Implement the `Searcher.search()` method in the client so it can communicate with your
API. We've included `jQuery` on the page so you can use that if you like.

3. Build the `/search` endpoint which returns the N most popular products across all shops
near the user. The endpoint should receive:
    1. the number (N) of products to return
    2. a pair of coordinates (the user position)
    3. a search radius (how far the search should extend)
    4. optionally, some tags (what types of shops the user wants to see)

    If tags are provided, a shop needs to have at least one of them to be considered a
    candidate. You can use any Python library to your aid but you can't use any external
    databases or search engines (e.g PostGIS, Elasticsearch, etc). You should build your
    solution as if the data is static and cannot be updated by any external processes.

4. Write some tests. A test foundation is provided for you in `tests/conftest.py`.

5. Briefly think about and answer the questions in THOUGHTS.md.

*You should deliver your solution as a `git` repository, preferably hosted on GitHub.*

Things we look for
------------------

In a nutshell we're looking for correctness, good code design and sensible choices when
it comes to performance. Imagine that your API will be used by a lot of people – how does
that affect your design? Also, imagine that your code will be read by other developers in
your team – keep them happy :-)

Resources
---------

1. `Flask`: http://flask.pocoo.org/
2. `pytest`: http://pytest.org/latest/
3. `virtualenvwrapper`: https://virtualenvwrapper.readthedocs.io/en/latest/