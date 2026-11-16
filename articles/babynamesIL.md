# Analysis

``` r

library(babynamesIL)
library(tidyverse)
#> ── Attaching core tidyverse packages ──────────────────────── tidyverse 2.0.0 ──
#> ✔ dplyr     1.2.1     ✔ readr     2.2.0
#> ✔ forcats   1.0.1     ✔ stringr   1.6.0
#> ✔ ggplot2   4.0.4     ✔ tibble    3.3.1
#> ✔ lubridate 1.9.5     ✔ tidyr     1.3.2
#> ✔ purrr     1.2.2     
#> ── Conflicts ────────────────────────────────────────── tidyverse_conflicts() ──
#> ✖ dplyr::filter() masks stats::filter()
#> ✖ dplyr::lag()    masks stats::lag()
#> ℹ Use the conflicted package (<http://conflicted.r-lib.org/>) to force all conflicts to become errors
library(tgstat)
theme_set(theme_classic())
```

## Israeli baby names

This package contains Israeli baby names data from 1949-2024, covering
four demographic sectors: Jewish, Muslim, Christian-Arab, and Druze.

### Distribution of names

We will start by looking at the distribution total number of babies for
each name:

``` r

babynamesIL_totals %>%
    mutate(sector = factor(sector, levels = c("Jewish", "Muslim", "Christian-Arab", "Druze"))) %>%
    ggplot(aes(x = total, color = sex)) +
    ggsci::scale_color_aaas() +
    geom_density() +
    scale_x_log10() +
    facet_grid(. ~ sector) +
    theme(axis.text.x = element_text(angle = 90, hjust = 1))
```

![](babynamesIL_files/figure-html/unnamed-chunk-2-1.png)

Note that the x axis is in log scale.

### Top names

Top 20 names in each sex and sector:

``` r

babynamesIL_totals %>%
    mutate(sector = factor(sector, levels = c("Jewish", "Muslim", "Christian-Arab", "Druze"))) %>%
    group_by(sector, sex) %>%
    slice_max(order_by = total, n = 20) %>%
    arrange(sector, sex, desc(total)) %>%
    mutate(name = forcats::fct_inorder(name)) %>%
    ggplot(aes(x = name, y = total)) +
    geom_col() +
    facet_wrap(sector ~ sex, scales = "free", ncol = 2) +
    ylab("total #") +
    xlab("") +
    theme(axis.text.x = element_text(angle = 90, hjust = 1))
```

![](babynamesIL_files/figure-html/unnamed-chunk-3-1.png)

### Names over time

#### a single name

``` r

babynamesIL %>%
    tidyr::complete(sector, year, sex, name, fill = list(n = 0, prop = 0)) %>%
    filter(name == "מעיין", sector == "Jewish") %>%
    ggplot(aes(x = year, y = prop, color = sex)) +
    geom_line() +
    ggsci::scale_color_aaas() +
    scale_y_continuous(labels = scales::percent) +
    ggtitle("מעיין הבן מול מעיין הבת") +
    theme_classic()
```

![](babynamesIL_files/figure-html/unnamed-chunk-4-1.png)

#### clustering

We will then create a matrix of the names and their frequencies over
time. We will start with Jewish female babies.

``` r

names_mat <- babynamesIL %>%
    filter(sector == "Jewish", sex == "F") %>%
    select(year, name, prop) %>%
    spread(year, prop, fill = 0) %>%
    column_to_rownames("name") %>%
    as.matrix()
dim(names_mat)
#> [1] 2302   76
```

Normalize each name:

``` r

mat_norm <- names_mat / rowSums(names_mat)
```

Select only names with at least 500 babies:

``` r

mat_norm_f <- mat_norm[babynamesIL_totals %>%
    filter(sector == "Jewish", sex == "F") %>%
    filter(total >= 500) %>%
    pull(name), ]
dim(mat_norm_f)
#> [1] 668  76
```

Cluster:

``` r

hc <- tgs_cor(t(mat_norm_f)) %>%
    tgs_dist() %>%
    hclust(method = "ward.D2")
```

Reorder the clustering by year:

``` r

hc <- as.hclust(reorder(
    as.dendrogram(hc),
    apply(mat_norm_f, 1, which.max),
    agglo.FUN = mean
))
```

Plot the matrix:

``` r

text_mat <- babynamesIL %>%
    filter(sector == "Jewish", sex == "F") %>%
    tidyr::complete(sector, year, sex, name, fill = list(n = 0)) %>%
    mutate(text = paste(name, paste0("year: ", year), paste0("n: ", n), sep = "\n")) %>%
    select(year, name, text) %>%
    spread(year, text) %>%
    column_to_rownames("name") %>%
    as.matrix()
text_mat <- text_mat[rownames(mat_norm_f), colnames(mat_norm_f)]
plotly::plot_ly(z = mat_norm_f[hc$order, ], y = rownames(mat_norm_f)[hc$order], x = colnames(mat_norm_f), type = "heatmap", colors = colorRampPalette(c("white", "blue", "red", "yellow"))(1000), hoverinfo = "text", text = text_mat[hc$order, ]) %>%
    plotly::layout(yaxis = list(title = ""), xaxis = list(title = "Year"))
```

We will wrap it all in a function:

``` r

cluster_names <- function(sector, sex, min_total = 500, colors = colorRampPalette(c
                          ("white", "blue", "red", "yellow"))(1000)) {
    names_mat <- babynamesIL %>%
        filter(sector == !!sector, sex == !!sex) %>%
        select(year, name, prop) %>%
        spread(year, prop, fill = 0) %>%
        column_to_rownames("name") %>%
        as.matrix()
    text_mat <- babynamesIL %>%
        filter(sector == !!sector, sex == !!sex) %>%
        tidyr::complete(sector, year, sex, name, fill = list(n = 0)) %>%
        mutate(text = paste(name, paste0("year: ", year), paste0("n: ", n), sep = "\n")) %>%
        select(year, name, text) %>%
        spread(year, text) %>%
        column_to_rownames("name") %>%
        as.matrix()
    mat_norm <- names_mat / rowSums(names_mat)
    top_names <- babynamesIL_totals %>%
        filter(sector == !!sector, sex == !!sex) %>%
        filter(total >= min_total) %>%
        pull(name)
    top_names <- intersect(top_names, rownames(mat_norm))
    mat_norm_f <- mat_norm[top_names, ]
    text_mat <- text_mat[rownames(mat_norm_f), colnames(mat_norm_f)]
    hc <- tgs_cor(t(mat_norm_f)) %>%
        tgs_dist() %>%
        hclust(method = "ward.D2")
    hc <- as.hclust(reorder(
        as.dendrogram(hc),
        apply(mat_norm_f, 1, which.max),
        agglo.FUN = mean
    ))
    plotly::plot_ly(z = mat_norm_f[hc$order, ], y = rownames(mat_norm_f)[hc$order], x = colnames(mat_norm_f), type = "heatmap", colors = colors, hoverinfo = "text", text = text_mat[hc$order, ]) %>%
        plotly::layout(yaxis = list(title = ""), xaxis = list(title = "Year"))
}
```

We can now plot also the Male names:

``` r

cluster_names("Jewish", "M")
```

Or other sectors:

``` r

cluster_names("Muslim", "M")
```

``` r

cluster_names("Muslim", "F")
```

``` r

cluster_names("Christian-Arab", "M", 50)
```

``` r

cluster_names("Christian-Arab", "F", 50)
```

``` r

cluster_names("Druze", "M", 50)
```

``` r

cluster_names("Druze", "F", 50)
```

### Unisex names

We can plot names that are used for both male and female in a given
year, e.g. 2024:

``` r

babynamesIL %>%
    filter(sector == "Jewish", year == 2024) %>%
    pivot_wider(names_from = "sex", values_from = c("n", "prop"), values_fill = 0) %>%
    filter(n_M > 0 & n_F > 0) %>%
    ggplot(aes(x = n_M, y = n_F, label = name)) +
    geom_point() +
    scale_x_log10() +
    scale_y_log10() +
    ggrepel::geom_text_repel() +
    geom_abline()
```

![](babynamesIL_files/figure-html/unnamed-chunk-14-1.png)

Or we can use the matrices we created before to find patterns in the
ratio between male and female over time:

``` r

cluster_unisex_names <- function(sector, colors = colorRampPalette(c("blue", "white", "red"))(1000), epsilon = 1e-3) {
    mat_M <- babynamesIL %>%
        filter(sector == !!sector, sex == "M") %>%
        tidyr::complete(sector, year, sex, name, fill = list(n = 0, prop = 0)) %>%
        select(year, name, prop) %>%
        spread(year, prop, fill = 0) %>%
        column_to_rownames("name") %>%
        as.matrix()
    mat_F <- babynamesIL %>%
        filter(sector == !!sector, sex == "F") %>%
        tidyr::complete(sector, year, sex, name, fill = list(n = 0, prop = 0)) %>%
        select(year, name, prop) %>%
        spread(year, prop, fill = 0) %>%
        column_to_rownames("name") %>%
        as.matrix()
    uni_names <- intersect(rownames(mat_M), rownames(mat_F))
    ratio_mat <- log2(mat_M[uni_names, ] + epsilon) - log2(mat_F[uni_names, ] + epsilon)
    text_mat <- babynamesIL %>%
        filter(sector == !!sector) %>%
        tidyr::complete(sector, year, sex, name, fill = list(n = 0, prop = 0)) %>%
        pivot_wider(names_from = "sex", values_from = c("n", "prop"), values_fill = 0) %>%
        mutate(
            text =
                paste(name,
                    paste0("year: ", year),
                    paste0("# of male: ", n_M),
                    paste0("# of female: ", n_F),
                    paste0("% of male: ", scales::percent(prop_M)),
                    paste0("% of female: ", scales::percent(prop_F)),
                    sep = "\n"
                )
        ) %>%
        select(year, name, text) %>%
        spread(year, text) %>%
        column_to_rownames("name") %>%
        as.matrix()
    text_mat <- text_mat[rownames(ratio_mat), colnames(ratio_mat)]
    colors <- colorRampPalette(c("blue", "white", "red"))(1000)
    hc <- tgs_cor(t(ratio_mat)) %>%
        tgs_dist() %>%
        hclust(method = "ward.D2")
    hc <- as.hclust(reorder(
        as.dendrogram(hc),
        apply(ratio_mat, 1, which.max),
        agglo.FUN = mean
    ))
    n_names <- length(uni_names)
    plotly::plot_ly(z = ratio_mat[hc$order, ], y = rownames(ratio_mat)[hc$order], x = colnames(ratio_mat), type = "heatmap", colors = colors, zmid = 0, hoverinfo = "text", text = text_mat[hc$order, ]) %>%
        plotly::layout(title = paste0(n_names, " unisex names from the ", sector, " sector"), yaxis = list(title = ""), xaxis = list(title = "Year"))
}
```

Run the function - red is more male names and blue is more female names:

``` r

cluster_unisex_names("Jewish")
```

``` r

cluster_unisex_names("Muslim")
```

``` r

cluster_unisex_names("Christian-Arab")
```

``` r

cluster_unisex_names("Druze")
```

### Names that are growing in a short period of time

We can look at names that are growing in popularity in a short period of
time, e.g. a single year. Only consecutive years where the name is
listed in both are compared, so names that jumped from below 5 babies
(not listed) to 100 or more are not covered.

``` r

growth_names <- babynamesIL %>%
    arrange(sector, sex, name, year) %>%
    group_by(sector, name, sex) %>%
    mutate(next_n = lead(n), next_year = lead(year)) %>%
    ungroup() %>%
    filter(next_year == year + 1, next_n >= 100) %>% # take only names with at least 100 babies in the next year
    mutate(growth = next_n / n) %>%
    filter(growth >= 2) %>%
    arrange(desc(growth))
head(growth_names)
#> # A tibble: 6 × 9
#>   sector  year sex   name       n     prop next_n next_year growth
#>   <chr>  <dbl> <chr> <chr>  <int>    <dbl>  <int>     <dbl>  <dbl>
#> 1 Muslim  2008 F     ג'ינא      6 0.000401    102      2009   17  
#> 2 Muslim  2007 F     למיס       8 0.000545    126      2008   15.8
#> 3 Muslim  1974 M     וסאם      24 0.00262     359      1975   15.0
#> 4 Jewish  2010 M     עתי        9 0.000143    109      2011   12.1
#> 5 Jewish  2021 M     שמריהו    16 0.000232    161      2022   10.1
#> 6 Muslim  2008 F     גינא      22 0.00147     221      2009   10.0
nrow(growth_names)
#> [1] 140
```

Plot:

``` r

growth_names %>%
    filter(sector == "Jewish") %>%
    rename(`Number of babies` = next_n) %>%
    ggplot(aes(x = year + 1, y = growth, size = `Number of babies`, label = name, color = sex)) +
    geom_point() +
    theme_classic() +
    scale_y_log10() +
    ggsci::scale_color_aaas() +
    ggrepel::geom_text_repel(size = 6) +
    scale_x_continuous(breaks = seq(1949, 2024, 5)) +
    xlab("Year") +
    ylab("Growth")
```

![](babynamesIL_files/figure-html/unnamed-chunk-18-1.png)

### Declining names

We can look for names that declined the most from their peak year,
comparing the peak with the lowest count in the years after it:

``` r

decline_names_overall <- babynamesIL %>%
    arrange(sector, sex, name, year) %>%
    group_by(sector, name, sex) %>%
    mutate(max_n = max(n), max_year = year[which.max(n)]) %>%
    filter(year > max_year) %>%
    summarise(max_n = max_n[1], max_year = max_year[1], min_n = min(n), min_year = year[which.min(n)], decline = 1 - (min_n / max_n), .groups = "drop") %>%
    filter(max_n >= 100) %>%
    filter(decline >= 0.95)
decline_names_overall %>%
    arrange(max_n)
#> # A tibble: 232 × 8
#>    sector name   sex   max_n max_year min_n min_year decline
#>    <chr>  <chr>  <chr> <int>    <dbl> <int>    <dbl>   <dbl>
#>  1 Jewish אבירן  M       100     1987     5     2005   0.95 
#>  2 Jewish עפרה   F       100     1960     5     1989   0.95 
#>  3 Jewish דלית   F       102     1970     5     1997   0.951
#>  4 Jewish סלומון M       102     1949     5     2003   0.951
#>  5 Muslim גדיר   F       102     1990     5     2013   0.951
#>  6 Jewish ולרי   M       103     1963     5     1998   0.951
#>  7 Jewish לידיה  F       104     1949     5     1995   0.952
#>  8 Jewish מלי    F       104     1979     5     2003   0.952
#>  9 Jewish לירן   F       106     1984     5     2023   0.953
#> 10 Muslim היא    F       106     1993     5     2014   0.953
#> # ℹ 222 more rows
```

Plot:

``` r

decline_names_overall %>%
    ggplot(aes(x = max_year, y = max_n, label = name, color = sex)) +
    geom_point() +
    theme_classic() +
    ggsci::scale_color_aaas() +
    ggrepel::geom_text_repel() +
    xlab("Year") +
    scale_y_log10() +
    ylab("Number of babies")
```

![](babynamesIL_files/figure-html/unnamed-chunk-20-1.png)
