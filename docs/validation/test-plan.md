|  №  | Component/Function                    | Test Level  | Type (Positive/Negative) | Expected Result / Acceptance Criteria                               |
| :-: | ------------------------------------- | ----------- | ------------------------ | ------------------------------------------------------------------- |
|  1  | View all parking spots                | unit        | positive                 | Returns the parking spots table in less than 3 seconds              |
|  2  | View all parking spots                | integration | positive                 | Returns the parking spots table with all data matching the database |
|  3  | Error messages and push notifications | acceptance  | negative                 | Scraper error text is correctly processed                           |
|  4  | Error messages and push notifications | unit        | negative                 | Endpoint returns a 500 error                                        |
|  5  | Adding parking information            | unit        | positive                 | Parking spot is correctly added by the operator                     |
